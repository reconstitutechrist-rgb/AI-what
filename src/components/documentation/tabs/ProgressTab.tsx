'use client';

/**
 * ProgressTab - Displays phase execution progress with expandable cards
 */

import React, { useState } from 'react';
import {
  CheckCircleIcon,
  ClockIcon,
  LoaderIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  FileIcon,
  AlertTriangleIcon,
  XIcon,
} from '@/components/ui/Icons';
import type { PhaseExecutionRecord, BuildStatus } from '@/types/projectDocumentation';

interface ProgressTabProps {
  executions: PhaseExecutionRecord[];
  buildStatus: BuildStatus;
}

interface PhaseCardProps {
  execution: PhaseExecutionRecord;
}

function StatusIcon({ status }: { status: PhaseExecutionRecord['status'] }) {
  switch (status) {
    case 'completed':
      return <CheckCircleIcon size={20} className="text-green-400" />;
    case 'failed':
      return <XIcon size={20} className="text-red-400" />;
    case 'in-progress':
      return <LoaderIcon size={20} className="text-blue-400" />;
    case 'skipped':
      return <AlertTriangleIcon size={20} className="text-yellow-400" />;
    default:
      return <ClockIcon size={20} className="text-zinc-500" />;
  }
}

function formatDuration(ms?: number): string {
  if (!ms) return '-';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
}

function PhaseCard({ execution }: PhaseCardProps) {
  const [expanded, setExpanded] = useState(false);
  const hasDetails =
    execution.generatedFiles?.length ||
    execution.implementedFeatures?.length ||
    execution.errors?.length ||
    execution.generatedCode;

  return (
    <div
      className={`bg-zinc-800/30 rounded-lg border ${
        execution.status === 'failed'
          ? 'border-red-500/30'
          : execution.status === 'completed'
            ? 'border-green-500/20'
            : 'border-zinc-800'
      }`}
    >
      {/* Summary Row */}
      <button
        onClick={() => hasDetails && setExpanded(!expanded)}
        disabled={!hasDetails}
        className={`w-full flex items-center gap-3 p-3 text-left ${
          hasDetails ? 'cursor-pointer hover:bg-zinc-800/50' : 'cursor-default'
        } transition-colors rounded-lg`}
      >
        <StatusIcon status={execution.status} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-500">Phase {execution.phaseNumber}</span>
            <span className="text-sm font-medium text-zinc-200 truncate">
              {execution.phaseName}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-zinc-500 mt-0.5">
            <span>{execution.domain}</span>
            <span>{formatDuration(execution.duration)}</span>
            {execution.tokensUsed && (
              <span>
                {((execution.tokensUsed.input + execution.tokensUsed.output) / 1000).toFixed(1)}k
                tokens
              </span>
            )}
          </div>
        </div>

        {hasDetails && (
          <span className="text-zinc-500">
            {expanded ? <ChevronDownIcon size={16} /> : <ChevronRightIcon size={16} />}
          </span>
        )}
      </button>

      {/* Expanded Details */}
      {expanded && (
        <div className="px-3 pb-3 border-t border-zinc-800 mt-1 pt-3">
          {/* Planned vs Implemented */}
          <div className="mb-3">
            <div className="text-xs font-medium text-zinc-400 mb-1">Planned Features</div>
            <div className="flex flex-wrap gap-1">
              {execution.plannedFeatures.map((feature, i) => {
                const implemented = execution.implementedFeatures?.includes(feature);
                return (
                  <span
                    key={i}
                    className={`px-1.5 py-0.5 rounded text-xs ${
                      implemented
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-zinc-700/50 text-zinc-400'
                    }`}
                  >
                    {implemented && '✓ '}
                    {feature}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Generated Files */}
          {execution.generatedFiles && execution.generatedFiles.length > 0 && (
            <div className="mb-3">
              <div className="text-xs font-medium text-zinc-400 mb-1 flex items-center gap-1">
                <FileIcon size={12} />
                Generated Files
              </div>
              <div className="bg-zinc-900/50 rounded p-2 max-h-24 overflow-y-auto">
                {execution.generatedFiles.map((file, i) => (
                  <div key={i} className="text-xs text-zinc-500 font-mono">
                    {file}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Errors */}
          {execution.errors && execution.errors.length > 0 && (
            <div className="mb-3">
              <div className="text-xs font-medium text-red-400 mb-1 flex items-center gap-1">
                <XIcon size={12} />
                Errors
              </div>
              <div className="bg-red-500/10 rounded p-2 max-h-24 overflow-y-auto">
                {execution.errors.map((error, i) => (
                  <div key={i} className="text-xs text-red-400">
                    {error}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="text-xs text-zinc-600 flex gap-4">
            {execution.startedAt && (
              <span>Started: {new Date(execution.startedAt).toLocaleTimeString()}</span>
            )}
            {execution.completedAt && (
              <span>Completed: {new Date(execution.completedAt).toLocaleTimeString()}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function BuildStatusBanner({ status }: { status: BuildStatus }) {
  const config: Record<BuildStatus, { icon: React.ReactNode; text: string; className: string }> = {
    planning: {
      icon: <ClockIcon size={16} />,
      text: 'Planning in progress...',
      className: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    },
    ready: {
      icon: <CheckCircleIcon size={16} />,
      text: 'Ready to build',
      className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    },
    building: {
      icon: <LoaderIcon size={16} />,
      text: 'Building...',
      className: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    },
    completed: {
      icon: <CheckCircleIcon size={16} />,
      text: 'Build completed successfully',
      className: 'bg-green-500/10 text-green-400 border-green-500/20',
    },
    failed: {
      icon: <XIcon size={16} />,
      text: 'Build failed',
      className: 'bg-red-500/10 text-red-400 border-red-500/20',
    },
    paused: {
      icon: <ClockIcon size={16} />,
      text: 'Build paused',
      className: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    },
  };

  const conf = config[status];

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${conf.className}`}>
      {conf.icon}
      <span className="text-sm font-medium">{conf.text}</span>
    </div>
  );
}

export function ProgressTab({ executions, buildStatus }: ProgressTabProps) {
  // Sort by phase number
  const sortedExecutions = [...executions].sort((a, b) => a.phaseNumber - b.phaseNumber);

  // Calculate progress
  const completed = executions.filter((e) => e.status === 'completed').length;
  const failed = executions.filter((e) => e.status === 'failed').length;
  const total = executions.length;
  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="p-4">
      {/* Build Status */}
      <div className="mb-4">
        <BuildStatusBanner status={buildStatus} />
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
          <span>Progress</span>
          <span>
            {completed}/{total} phases ({progressPercent}%)
          </span>
        </div>
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              failed > 0 ? 'bg-gradient-to-r from-green-500 to-red-500' : 'bg-green-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {failed > 0 && <div className="text-xs text-red-400 mt-1">{failed} phase(s) failed</div>}
      </div>

      {/* Phase Cards */}
      <div className="space-y-2">
        {sortedExecutions.map((execution) => (
          <PhaseCard key={execution.phaseNumber} execution={execution} />
        ))}
      </div>

      {executions.length === 0 && (
        <div className="text-center py-8">
          <ClockIcon size={32} className="text-zinc-600 mx-auto mb-2" />
          <div className="text-sm text-zinc-500">No phases executed yet</div>
          <div className="text-xs text-zinc-600">Start the build to see progress here</div>
        </div>
      )}
    </div>
  );
}

export default ProgressTab;
