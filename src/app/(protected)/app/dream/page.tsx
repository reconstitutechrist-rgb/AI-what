/**
 * Dream Room — Autonomous Maintenance UI
 *
 * Dedicated page for Dream Mode with:
 *   - Terminal log (green-on-black) showing real-time activity
 *   - Phase indicator (Loading → Discovering → Building → Testing → Fixing)
 *   - Stats dashboard (goals, bugs found/fixed, discoveries, elapsed time, cost)
 *   - Directive Queue panel with drag-to-reorder
 *   - Discovery Report panel
 *   - Pause/Stop controls
 *   - Wake Lock to prevent sleep
 */

'use client';

import React, { useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSettings } from '@/hooks/useSettings';
import { useDreamMode } from '@/hooks/useDreamMode';
import { useWakeLock } from '@/hooks/useWakeLock';
import { DirectiveQueue } from '@/components/dream/DirectiveQueue';
import { CHAOS_PROFILE_META } from '@/config/chaosProfile';
import type { CampaignPhase } from '@/types/dream';

// ============================================================================
// PHASE DISPLAY
// ============================================================================

const PHASE_LABELS: Record<CampaignPhase, { label: string; color: string }> = {
  IDLE: { label: 'Idle', color: 'text-zinc-500' },
  LOADING: { label: 'Loading Repository', color: 'text-blue-400' },
  DISCOVERING: { label: 'Discovering Features', color: 'text-amber-400' },
  BUILDING_GOAL: { label: 'Building Feature', color: 'text-purple-400' },
  CHAOS_TESTING: { label: 'Chaos Testing', color: 'text-red-400' },
  DIAGNOSING: { label: 'Diagnosing Crash', color: 'text-orange-400' },
  PATCHING: { label: 'Applying Patch', color: 'text-cyan-400' },
  VERIFYING: { label: 'Verifying Build', color: 'text-teal-400' },
  LOGGING: { label: 'Logging Results', color: 'text-zinc-400' },
  DONE: { label: 'Complete', color: 'text-green-400' },
};

// ============================================================================
// PAGE
// ============================================================================

export default function DreamPage() {
  const router = useRouter();
  const { settings } = useSettings();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const dream = useDreamMode({ iframeRef });
  const wakeLock = useWakeLock(dream.isDreaming);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [dream.logs]);

  // Redirect if dream mode not enabled
  if (!settings.dream.enabled) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950">
        <div className="text-center">
          <h1 className="mb-2 text-xl font-semibold text-zinc-200">Dream Mode Disabled</h1>
          <p className="mb-4 text-sm text-zinc-500">
            Enable Dream Mode in Settings to access the Dream Room.
          </p>
          <button
            onClick={() => router.push('/app/design')}
            className="rounded-lg bg-zinc-800 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700"
          >
            Back to Builder
          </button>
        </div>
      </div>
    );
  }

  const phase = PHASE_LABELS[dream.currentPhase];
  const elapsed = dream.stats?.elapsed ?? 0;
  const minutes = Math.floor(elapsed / 60000);
  const seconds = Math.floor((elapsed % 60000) / 1000);
  const profileMeta = CHAOS_PROFILE_META[settings.dream.chaosProfile];

  return (
    <div className="flex h-screen flex-col bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-3">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/app/design')}
            className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold">Dream Room</h1>
          <span className={`text-sm font-medium ${phase.color}`}>
            {phase.label}
          </span>
          {dream.isDreaming && (
            <span className="inline-flex items-center gap-1.5 text-xs text-green-500">
              <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
              Active
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Wake Lock indicator */}
          {wakeLock.isActive && (
            <span className="text-xs text-zinc-600" title="Screen Wake Lock active">
              WakeLock
            </span>
          )}
          {/* Profile badge */}
          <span className="rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-400">
            {profileMeta.label}
          </span>
          {/* Controls */}
          {!dream.isDreaming ? (
            <button
              onClick={dream.start}
              disabled={dream.currentPhase !== 'IDLE' && dream.currentPhase !== 'DONE'}
              className="rounded-lg bg-green-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Start Dream
            </button>
          ) : (
            <button
              onClick={dream.stop}
              className="rounded-lg bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-500"
            >
              Stop
            </button>
          )}
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Terminal + Stats */}
        <div className="flex flex-1 flex-col">
          {/* Stats bar */}
          <div className="grid grid-cols-7 gap-px border-b border-zinc-800 bg-zinc-900">
            <StatCard label="Time" value={`${minutes}:${seconds.toString().padStart(2, '0')}`} />
            <StatCard label="Goals" value={String(dream.stats?.goalsCompleted ?? 0)} />
            <StatCard label="Bugs Found" value={String(dream.stats?.bugsFound ?? 0)} />
            <StatCard label="Bugs Fixed" value={String(dream.stats?.bugsFixed ?? 0)} />
            <StatCard label="Discoveries" value={String(dream.stats?.discoveries ?? 0)} />
            <StatCard label="Budget Left" value={String(dream.stats?.budgetRemaining ?? '-')} />
            <StatCard label="Est. Cost" value={profileMeta.costEstimate} subtle />
          </div>

          {/* Terminal */}
          <div
            ref={terminalRef}
            className="flex-1 overflow-y-auto bg-black p-4 font-mono text-xs leading-relaxed"
          >
            {dream.logs.length === 0 ? (
              <p className="text-zinc-600">
                Dream terminal ready. Click &quot;Start Dream&quot; to begin an autonomous maintenance cycle.
              </p>
            ) : (
              dream.logs.map((line, i) => (
                <div
                  key={i}
                  className={
                    line.includes('[ERROR]')
                      ? 'text-red-400'
                      : line.includes('[WARN]')
                        ? 'text-yellow-400'
                        : line.includes('complete') || line.includes('Done') || line.includes('verified')
                          ? 'text-green-400'
                          : line.includes('Discovery') || line.includes('Auto-queued')
                            ? 'text-amber-400'
                            : 'text-green-300/80'
                  }
                >
                  {line}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right sidebar: Queue + Discovery */}
        <div className="flex w-96 flex-col border-l border-zinc-800">
          {/* Directive Queue */}
          <div className="flex-1 overflow-y-auto border-b border-zinc-800 p-4">
            <h2 className="mb-3 text-sm font-semibold text-zinc-300">Directive Queue</h2>
            <DirectiveQueue
              goals={dream.goalQueue}
              onAddGoal={dream.addGoal}
              onRemoveGoal={dream.removeGoal}
              onReorderGoals={dream.reorderGoals}
            />
          </div>

          {/* Discovery Report */}
          <div className="h-64 overflow-y-auto p-4">
            <h2 className="mb-3 text-sm font-semibold text-zinc-300">Discovery Report</h2>
            {dream.discoveryReport ? (
              <ul className="space-y-2">
                {dream.discoveryReport.discoveries.map((d, i) => (
                  <li key={i} className="rounded border border-zinc-800 p-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          d.status === 'ACTIVE'
                            ? 'text-green-400'
                            : d.status === 'PARTIALLY_CONNECTED'
                              ? 'text-amber-400'
                              : 'text-red-400'
                        }
                      >
                        {d.status === 'ACTIVE' ? '●' : d.status === 'PARTIALLY_CONNECTED' ? '◐' : '○'}
                      </span>
                      <span className="font-medium text-zinc-300">
                        {d.file.split('/').pop()}
                      </span>
                    </div>
                    <p className="mt-1 text-zinc-500">{d.inferredPurpose}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-zinc-600">
                No discovery report yet. Start a dream cycle to scan the repository.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Hidden iframe for Strategy B chaos testing (iframe injection) */}
      {dream.isDreaming && (
        <iframe
          ref={iframeRef}
          title="Dream Mode Preview"
          sandbox="allow-scripts allow-same-origin"
          className="absolute h-0 w-0 overflow-hidden opacity-0"
          aria-hidden="true"
        />
      )}
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function StatCard({ label, value, subtle }: { label: string; value: string; subtle?: boolean }) {
  return (
    <div className="px-4 py-2 text-center">
      <div className={`text-lg font-bold ${subtle ? 'text-zinc-400' : 'text-zinc-100'}`}>{value}</div>
      <div className="text-xs text-zinc-500">{label}</div>
    </div>
  );
}
