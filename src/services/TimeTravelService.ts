/**
 * Time Travel Service — "The Clock Manipulator"
 *
 * Injects a time-mocking shim into the WebContainer sandbox so that
 * the WorkflowAuditor can fast-forward the simulated clock without
 * waiting in real time.
 *
 * Mechanism:
 *   1. Writes a shim file (`__titan_time_shim.js`) to the container
 *   2. The shim overrides globalThis.Date and captures setTimeout/setInterval
 *   3. advanceTime() calls a script that loads the shim and triggers pending timers
 *
 * Safety: The shim only runs inside the WebContainer sandbox.
 *         The host browser's system clock is never touched.
 */

import { getWebContainerService } from '@/services/WebContainerService';
import type { TimeState } from '@/types/temporalWorkflow';

// ============================================================================
// CONSTANTS
// ============================================================================

/** Path where the time shim is injected in the WebContainer */
const SHIM_PATH = '__titan_time_shim.js';

/** Path for the time-advance runner script */
const RUNNER_PATH = '__titan_time_runner.js';

// ============================================================================
// SERVICE
// ============================================================================

class TimeTravelServiceInstance {
  private state: TimeState = {
    realStartTime: 0,
    offsetMs: 0,
    isActive: false,
  };

  /**
   * Inject the time-travel shim into the WebContainer.
   * Safe to call multiple times (idempotent).
   */
  async injectTimeMock(): Promise<void> {
    if (this.state.isActive) return;

    const shimCode = `
// ═══════════════════════════════════════════════════════════════════════════
// TITAN TIME TRAVEL SHIM — Injected by TimeTravelService
// ═══════════════════════════════════════════════════════════════════════════
(function() {
  'use strict';

  const _OriginalDate = Date;
  let _offsetMs = 0;

  // ── Pending scheduled tasks ─────────────────────────────────────────────
  const _pendingTimers = [];
  let _nextTimerId = 1;
  const _originalSetTimeout = globalThis.setTimeout;
  const _originalSetInterval = globalThis.setInterval;
  const _originalClearTimeout = globalThis.clearTimeout;
  const _originalClearInterval = globalThis.clearInterval;

  // ── Override Date ───────────────────────────────────────────────────────
  class MockDate extends _OriginalDate {
    constructor(...args) {
      if (args.length > 0) {
        super(...args);
      } else {
        super(_OriginalDate.now() + _offsetMs);
      }
    }
    static now() {
      return _OriginalDate.now() + _offsetMs;
    }
    static parse(str) {
      return _OriginalDate.parse(str);
    }
    static UTC(...args) {
      return _OriginalDate.UTC(...args);
    }
  }
  globalThis.Date = MockDate;

  // ── Override setTimeout ─────────────────────────────────────────────────
  globalThis.setTimeout = function(fn, delay, ...args) {
    const id = _nextTimerId++;
    const firesAt = _OriginalDate.now() + _offsetMs + (delay || 0);
    _pendingTimers.push({ id, fn, firesAt, args, type: 'timeout' });
    return id;
  };

  // ── Override setInterval ────────────────────────────────────────────────
  globalThis.setInterval = function(fn, interval, ...args) {
    const id = _nextTimerId++;
    const firesAt = _OriginalDate.now() + _offsetMs + (interval || 0);
    _pendingTimers.push({ id, fn, firesAt, args, type: 'interval', interval });
    return id;
  };

  globalThis.clearTimeout = function(id) {
    const idx = _pendingTimers.findIndex(t => t.id === id);
    if (idx >= 0) _pendingTimers.splice(idx, 1);
  };

  globalThis.clearInterval = globalThis.clearTimeout;

  // ── API for TimeTravelService ───────────────────────────────────────────
  globalThis.__TITAN_TIME = {
    getOffset: () => _offsetMs,

    advance: (ms) => {
      _offsetMs += ms;
      console.log('[TimeTravel] Clock advanced by ' + (ms / 1000) + 's (offset: ' + (_offsetMs / 1000) + 's total)');

      // Fire any timers that should have triggered in this window
      const now = _OriginalDate.now() + _offsetMs;
      const ready = _pendingTimers
        .filter(t => t.firesAt <= now)
        .sort((a, b) => a.firesAt - b.firesAt);

      for (const timer of ready) {
        try {
          timer.fn(...timer.args);
        } catch (e) {
          console.error('[TimeTravel] Timer error:', e);
        }

        // Remove timeouts, reschedule intervals
        const idx = _pendingTimers.indexOf(timer);
        if (idx >= 0) {
          if (timer.type === 'interval') {
            timer.firesAt = now + timer.interval;
          } else {
            _pendingTimers.splice(idx, 1);
          }
        }
      }

      return { fired: ready.length, remaining: _pendingTimers.length };
    },

    reset: () => {
      _offsetMs = 0;
      _pendingTimers.length = 0;
      console.log('[TimeTravel] Clock reset to real time');
    }
  };

  console.log('[TimeTravel] Shim loaded. Date and timers are now mocked.');
})();
`;

    // Runner script — used by advanceTime() to trigger the shim
    const runnerCode = `
require('./${SHIM_PATH}');
const ms = parseInt(process.argv[2] || '0');
if (ms > 0) {
  const result = globalThis.__TITAN_TIME.advance(ms);
  console.log(JSON.stringify(result));
}
`;

    const webContainer = getWebContainerService();
    await webContainer.writeFile(SHIM_PATH, shimCode);
    await webContainer.writeFile(RUNNER_PATH, runnerCode);

    this.state = {
      realStartTime: Date.now(),
      offsetMs: 0,
      isActive: true,
    };

    console.log('[TimeTravelService] Shim injected into WebContainer.');
  }

  /**
   * Fast-forward the simulated clock by the given duration.
   * Triggers all scheduled timers that would have fired in the window.
   *
   * @param durationStr - e.g., "7d", "24h", "30m", "10s"
   * @returns Number of timers fired
   */
  async advanceTime(durationStr: string): Promise<{ fired: number; remaining: number }> {
    const ms = this.parseDuration(durationStr);
    this.state.offsetMs += ms;

    const webContainer = getWebContainerService();
    const { output, exitCode } = await webContainer.executeShell(
      'node',
      [RUNNER_PATH, String(ms)],
      10_000
    );

    if (exitCode !== 0) {
      console.warn(`[TimeTravelService] advanceTime failed: ${output}`);
      return { fired: 0, remaining: 0 };
    }

    try {
      return JSON.parse(output.trim().split('\n').pop() || '{}');
    } catch {
      return { fired: 0, remaining: 0 };
    }
  }

  /**
   * Reset the simulated clock to real time.
   */
  async reset(): Promise<void> {
    if (!this.state.isActive) return;

    const webContainer = getWebContainerService();
    await webContainer.executeShell(
      'node',
      ['-e', `require('./${SHIM_PATH}'); globalThis.__TITAN_TIME.reset();`],
      5_000
    );

    this.state = {
      realStartTime: 0,
      offsetMs: 0,
      isActive: false,
    };

    console.log('[TimeTravelService] Clock reset.');
  }

  /**
   * Get the current state of the simulated clock.
   */
  getTimeState(): TimeState {
    return { ...this.state };
  }

  /**
   * Get the current simulated timestamp.
   */
  getCurrentSimulatedTime(): number {
    return Date.now() + this.state.offsetMs;
  }

  /**
   * Parse a human-readable duration string to milliseconds.
   */
  private parseDuration(str: string): number {
    const match = str.match(/^(\d+)(s|m|h|d)$/);
    if (!match) {
      console.warn(`[TimeTravelService] Invalid duration "${str}", defaulting to 0`);
      return 0;
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's': return value * 1_000;
      case 'm': return value * 60 * 1_000;
      case 'h': return value * 60 * 60 * 1_000;
      case 'd': return value * 24 * 60 * 60 * 1_000;
      default:  return 0;
    }
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

let _instance: TimeTravelServiceInstance | null = null;

export function getTimeTravelService(): TimeTravelServiceInstance {
  if (!_instance) {
    _instance = new TimeTravelServiceInstance();
  }
  return _instance;
}

export type { TimeTravelServiceInstance };
