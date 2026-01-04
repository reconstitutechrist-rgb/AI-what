'use client';

import React, { useMemo } from 'react';
import type { LayoutDesign } from '@/types/layoutDesign';
import {
  lintDesign,
  getIssuesByCategory,
  getSeverityInfo,
  getGradeColor,
  type LintResult,
  type LintCategory,
} from '@/utils/designLinter';

interface LintPanelProps {
  design: Partial<LayoutDesign>;
}

/**
 * Design Linting Panel - displays consistency checks and suggestions
 */
export function LintPanel({ design }: LintPanelProps) {
  const lintResult = useMemo(() => lintDesign(design), [design]);
  const issuesByCategory = useMemo(() => getIssuesByCategory(lintResult), [lintResult]);

  const categoryLabels: Record<LintCategory, { label: string; icon: string }> = {
    accessibility: { label: 'Accessibility', icon: '♿' },
    colors: { label: 'Colors', icon: '🎨' },
    typography: { label: 'Typography', icon: '📝' },
    spacing: { label: 'Spacing', icon: '📐' },
    effects: { label: 'Effects', icon: '✨' },
  };

  return (
    <div className="space-y-4">
      {/* Score Header */}
      <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
        <div>
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Design Quality</div>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-bold ${getGradeColor(lintResult.grade)}`}>
              {lintResult.grade}
            </span>
            <span className="text-sm text-slate-400">{lintResult.score}/100</span>
          </div>
        </div>
        <div className="text-right text-xs text-slate-500">
          <div className="flex items-center gap-3">
            {lintResult.summary.errors > 0 && (
              <span className="flex items-center gap-1 text-red-400">
                <span className="w-2 h-2 rounded-full bg-red-400"></span>
                {lintResult.summary.errors} errors
              </span>
            )}
            {lintResult.summary.warnings > 0 && (
              <span className="flex items-center gap-1 text-yellow-400">
                <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                {lintResult.summary.warnings} warnings
              </span>
            )}
            {lintResult.summary.info > 0 && (
              <span className="flex items-center gap-1 text-garden-400">
                <span className="w-2 h-2 rounded-full bg-garden-400"></span>
                {lintResult.summary.info} suggestions
              </span>
            )}
          </div>
        </div>
      </div>

      {/* No Issues */}
      {lintResult.issues.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          <div className="text-4xl mb-2">🎉</div>
          <div className="text-sm">No issues found!</div>
          <div className="text-xs text-slate-600 mt-1">
            Your design passes all consistency checks
          </div>
        </div>
      )}

      {/* Issues by Category */}
      {(Object.entries(issuesByCategory) as [LintCategory, LintResult['issues']][])
        .filter(([, issues]) => issues.length > 0)
        .map(([category, issues]) => (
          <div key={category} className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
              <span>{categoryLabels[category].icon}</span>
              <span>{categoryLabels[category].label}</span>
              <span className="text-xs text-slate-500">({issues.length})</span>
            </div>

            <div className="space-y-2">
              {issues.map((issue) => {
                const severityInfo = getSeverityInfo(issue.severity);
                return (
                  <div
                    key={issue.id}
                    className={`p-3 rounded-lg ${severityInfo.bgColor} border border-slate-700/50`}
                  >
                    <div className="flex items-start gap-2">
                      <span className={`${severityInfo.color} text-sm mt-0.5`}>
                        {severityInfo.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-slate-200">{issue.message}</div>
                        {issue.details && (
                          <div className="text-xs text-slate-400 mt-1">{issue.details}</div>
                        )}
                        {issue.suggestion && (
                          <div className="text-xs text-slate-500 mt-1 italic">
                            💡 {issue.suggestion}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

      {/* Legend */}
      <div className="pt-2 border-t border-slate-700/50">
        <div className="text-xs text-slate-600 flex items-center justify-center gap-4">
          <span className="flex items-center gap-1">
            <span className="text-red-400">✕</span> Error
          </span>
          <span className="flex items-center gap-1">
            <span className="text-yellow-400">⚠</span> Warning
          </span>
          <span className="flex items-center gap-1">
            <span className="text-garden-400">ℹ</span> Suggestion
          </span>
        </div>
      </div>
    </div>
  );
}

export default LintPanel;
