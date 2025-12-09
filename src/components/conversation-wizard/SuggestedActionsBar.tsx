'use client';

interface SuggestedAction {
  label: string;
  action: string;
}

interface SuggestedActionsBarProps {
  actions: SuggestedAction[];
  onAction: (action: string) => void;
  disabled?: boolean;
}

/**
 * Suggested actions bar for wizard conversation
 */
export function SuggestedActionsBar({
  actions,
  onAction,
  disabled = false,
}: SuggestedActionsBarProps) {
  if (actions.length === 0) return null;

  return (
    <div className="px-6 py-2 flex flex-wrap gap-2">
      {actions.map((action) => (
        <button
          key={action.action}
          onClick={() => onAction(action.action)}
          disabled={disabled}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}

export default SuggestedActionsBar;
