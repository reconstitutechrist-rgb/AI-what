'use client';

/**
 * Concept Update Confirm Dialog
 *
 * Displays a diff of proposed concept changes and allows the user to:
 * - Cancel (no changes)
 * - Apply without regenerating phases
 * - Apply and regenerate phases
 */

import React from 'react';
import { XIcon, CheckIcon, RefreshCwIcon, AlertCircle } from 'lucide-react';
import { FocusTrap } from '../ui/FocusTrap';
import type { ConceptChange } from '@/types/reviewTypes';

export interface ConceptUpdateConfirmDialogProps {
  isOpen: boolean;
  changes: ConceptChange[];
  isLoading?: boolean;
  onConfirm: (regeneratePhases: boolean) => void;
  onCancel: () => void;
}

/**
 * Get badge color style based on change type
 */
function getChangeBadgeStyle(type: 'added' | 'removed' | 'modified'): React.CSSProperties {
  switch (type) {
    case 'added':
      return {
        background: 'var(--success-muted, rgba(34, 197, 94, 0.1))',
        color: 'var(--success-primary, #22c55e)',
      };
    case 'removed':
      return {
        background: 'var(--error-muted, rgba(239, 68, 68, 0.1))',
        color: 'var(--error-primary, #ef4444)',
      };
    case 'modified':
      return {
        background: 'var(--warning-muted, rgba(245, 158, 11, 0.1))',
        color: 'var(--warning-primary, #f59e0b)',
      };
  }
}

export function ConceptUpdateConfirmDialog({
  isOpen,
  changes,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConceptUpdateConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <FocusTrap onEscape={onCancel}>
        <div
          className="rounded-xl max-w-lg w-full shadow-2xl"
          style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: 'var(--accent-muted)' }}
              >
                <AlertCircle className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
              </div>
              <div>
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Confirm Concept Changes
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Review the changes before applying
                </p>
              </div>
            </div>
          </div>

          {/* Changes List */}
          <div className="px-6 py-4 max-h-64 overflow-y-auto">
            {changes.length === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>
                No changes detected
              </p>
            ) : (
              <div className="space-y-2">
                {changes.map((change, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg"
                    style={{ background: 'var(--bg-secondary)' }}
                  >
                    <span
                      className="flex-shrink-0 px-2 py-0.5 rounded text-xs font-medium capitalize"
                      style={getChangeBadgeStyle(change.type)}
                    >
                      {change.type}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {change.field}
                      </p>
                      {change.type === 'modified' &&
                        change.oldValue !== undefined &&
                        change.newValue !== undefined && (
                          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                            <span className="line-through opacity-60">
                              {String(
                                typeof change.oldValue === 'object'
                                  ? JSON.stringify(change.oldValue)
                                  : change.oldValue
                              )}
                            </span>
                            <span className="mx-2">→</span>
                            <span>
                              {String(
                                typeof change.newValue === 'object'
                                  ? JSON.stringify(change.newValue)
                                  : change.newValue
                              )}
                            </span>
                          </p>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info text */}
          <div className="px-6 pb-4">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              These changes may affect your build plan. You can apply changes only, or regenerate
              phases to align with the updated concept.
            </p>
          </div>

          {/* Actions */}
          <div
            className="px-6 py-4 flex flex-col sm:flex-row gap-2"
            style={{ borderTop: '1px solid var(--border-color)' }}
          >
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="btn-secondary flex-1 py-2.5 disabled:opacity-50"
            >
              <XIcon className="w-4 h-4" />
              Cancel
            </button>
            <button
              onClick={() => onConfirm(false)}
              disabled={isLoading || changes.length === 0}
              className="btn-secondary flex-1 py-2.5 disabled:opacity-50"
            >
              <CheckIcon className="w-4 h-4" />
              Apply Only
            </button>
            <button
              onClick={() => onConfirm(true)}
              disabled={isLoading || changes.length === 0}
              className="btn-primary flex-1 py-2.5 disabled:opacity-50"
            >
              {isLoading ? (
                <RefreshCwIcon className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCwIcon className="w-4 h-4" />
              )}
              Apply & Regenerate
            </button>
          </div>
        </div>
      </FocusTrap>
    </div>
  );
}

export default ConceptUpdateConfirmDialog;
