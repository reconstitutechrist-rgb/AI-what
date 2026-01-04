'use client';

import { SaveIcon } from '@/components/ui/Icons';

interface RecoveryPromptDialogProps {
  draftAge: string;
  onStartFresh: () => void;
  onRecover: () => void;
  onCancel: () => void;
}

/**
 * Dialog prompt for recovering a saved conversation draft
 */
export function RecoveryPromptDialog({
  draftAge,
  onStartFresh,
  onRecover,
  onCancel,
}: RecoveryPromptDialogProps) {
  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="rounded-xl shadow-2xl p-8 max-w-md w-full"
        style={{
          background: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-color)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <div className="w-16 h-16 mx-auto rounded-xl bg-garden-600/20 flex items-center justify-center mb-4">
            <SaveIcon size={32} className="text-garden-400" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Resume Previous Session?</h2>
          <p className="mb-6" style={{ color: 'var(--text-muted)' }}>
            You have an unsaved conversation from{' '}
            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
              {draftAge}
            </span>
            . Would you like to continue where you left off?
          </p>
          <div className="flex gap-3">
            <button onClick={onStartFresh} className="btn-secondary flex-1 py-2.5">
              Start Fresh
            </button>
            <button onClick={onRecover} className="btn-primary flex-1 py-2.5">
              Resume
            </button>
          </div>
          <button
            onClick={onCancel}
            className="mt-4 text-sm transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default RecoveryPromptDialog;
