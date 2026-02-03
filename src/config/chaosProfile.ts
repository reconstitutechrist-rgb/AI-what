/**
 * Chaos Monkey Profiles
 *
 * Configurable intensity levels for Dream Mode's automated testing.
 * Each profile balances thoroughness vs. cost (AI API calls) and
 * browser resource usage (WebContainer is single-threaded).
 *
 * NAP       — Low cost, safe for quick checks
 * REM       — Balanced default, recommended for overnight runs
 * NIGHTMARE — Exhaustive testing, high API cost warning
 */

import type { ChaosProfile, ChaosProfileName } from '@/types/dream';

// ============================================================================
// PROFILES
// ============================================================================

export const CHAOS_PROFILES: Record<ChaosProfileName, ChaosProfile> = {
  /**
   * NAP — Low intensity "Nap Mode"
   * - Human-speed interactions (1 action/sec)
   * - 5-minute sessions
   * - Max 2 fixes per cycle
   * - Estimated cost: < $1 per cycle
   */
  NAP: {
    actionDelay: 1000,
    sessionDuration: 300,
    maxFixesPerCycle: 2,
    concurrentGremlins: 1,
  },

  /**
   * REM — Balanced "Deep Sleep" (Default)
   * - Super-human speed (4 actions/sec)
   * - 30-minute sessions
   * - Max 10 fixes per cycle
   * - Estimated cost: $2-5 per cycle
   *
   * Why 250ms delay: React takes ~16ms to render a frame. 250ms allows
   * React to "settle" between actions, ensuring crashes are real bugs
   * and not lag from Event Loop congestion.
   */
  REM: {
    actionDelay: 250,
    sessionDuration: 1800,
    maxFixesPerCycle: 10,
    concurrentGremlins: 1,
  },

  /**
   * NIGHTMARE — Maximum intensity (use with caution)
   * - Brute force speed (20 actions/sec)
   * - 1-hour sessions
   * - Max 50 fixes per cycle
   * - Estimated cost: $20+ per cycle
   *
   * WARNING: High API cost. Only use when deadlines loom
   * or you need exhaustive coverage.
   */
  NIGHTMARE: {
    actionDelay: 50,
    sessionDuration: 3600,
    maxFixesPerCycle: 50,
    concurrentGremlins: 1,
  },
};

// ============================================================================
// HELPERS
// ============================================================================

/** Get a chaos profile by name, defaulting to REM */
export function getChaosProfile(name: ChaosProfileName): ChaosProfile {
  return CHAOS_PROFILES[name] ?? CHAOS_PROFILES.REM;
}

/** Profile display metadata for UI */
export const CHAOS_PROFILE_META: Record<ChaosProfileName, {
  label: string;
  description: string;
  costEstimate: string;
  icon: string;
}> = {
  NAP: {
    label: 'Nap',
    description: 'Light testing, low cost. 5-minute sessions, max 2 fixes.',
    costEstimate: '< $1',
    icon: 'moon',
  },
  REM: {
    label: 'Deep Sleep',
    description: 'Balanced testing. 30-minute sessions, max 10 fixes.',
    costEstimate: '$2-5',
    icon: 'brain',
  },
  NIGHTMARE: {
    label: 'Nightmare',
    description: 'Exhaustive testing. 1-hour sessions, max 50 fixes. High cost!',
    costEstimate: '$20+',
    icon: 'zap',
  },
};

/** All available profile names */
export const CHAOS_PROFILE_NAMES: ChaosProfileName[] = ['NAP', 'REM', 'NIGHTMARE'];
