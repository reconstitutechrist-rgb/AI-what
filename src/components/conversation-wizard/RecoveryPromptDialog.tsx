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
        className="bg-zinc-900 text-white rounded-xl border border-zinc-800 shadow-2xl p-8 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <div className="w-16 h-16 mx-auto rounded-xl bg-blue-600/20 flex items-center justify-center mb-4">
            <SaveIcon size={32} className="text-blue-400" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Resume Previous Session?</h2>
          <p className="text-zinc-400 mb-6">
            You have an unsaved conversation from{' '}
            <span className="text-zinc-100 font-medium">{draftAge}</span>. Would you like to
            continue where you left off?
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
            className="mt-4 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default RecoveryPromptDialog;
