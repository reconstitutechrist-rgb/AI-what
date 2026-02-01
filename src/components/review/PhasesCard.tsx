'use client';

/**
 * Phases Card - Displays build phase plan for review
 *
 * Read-only list of generated phases with estimates.
 */

import { Clock, Layers } from 'lucide-react';
import type { DynamicPhase } from '@/types/dynamicPhases';

interface PhasesCardProps {
  phases: DynamicPhase[];
  estimatedTotalTime?: string;
}

export function PhasesCard({ phases, estimatedTotalTime }: PhasesCardProps) {
  return (
    <div
      className="p-6 rounded-xl"
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Build Plan
          </h2>
        </div>
        {estimatedTotalTime && (
          <div className="flex items-center gap-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            <Clock className="w-3.5 h-3.5" />
            {estimatedTotalTime}
          </div>
        )}
      </div>

      <div
        className="flex items-center gap-3 mb-4 text-sm"
        style={{ color: 'var(--text-secondary)' }}
      >
        <span>{phases.length} phases</span>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {phases.map((phase) => (
          <div
            key={phase.number}
            className="flex items-start gap-3 p-3 rounded-lg"
            style={{ background: 'var(--bg-tertiary)' }}
          >
            <div
              className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium"
              style={{
                background: 'var(--accent-muted)',
                color: 'var(--accent-primary)',
              }}
            >
              {phase.number}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {phase.name}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                {phase.description}
              </p>
              {phase.estimatedTime && (
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  Est: {phase.estimatedTime}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PhasesCard;
