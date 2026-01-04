'use client';

import type { SuggestedAction, ElementType, SelectedElementInfo } from '@/types/layoutDesign';
import { getQuickActionsForElement, type QuickAction } from '@/data/elementQuickActions';

interface SuggestedActionsBarProps {
  actions: SuggestedAction[];
  onAction: (action: string) => void;
  /** Selected element info for context-aware actions */
  selectedElement?: SelectedElementInfo | null;
  /** Callback to send a message to the AI */
  onSendMessage?: (message: string) => void;
}

/**
 * Suggested actions bar with element-context awareness
 * Shows element-specific quick actions when an element is selected
 */
export function SuggestedActionsBar({
  actions,
  onAction,
  selectedElement,
  onSendMessage,
}: SuggestedActionsBarProps) {
  // Get element-specific quick actions if an element is selected
  const elementActions = selectedElement
    ? getQuickActionsForElement(selectedElement.type as ElementType)
    : [];

  // Handle quick action click - sends the prompt to AI
  const handleQuickAction = (quickAction: QuickAction) => {
    if (onSendMessage) {
      // Include element context in the message
      const elementContext = selectedElement
        ? `For the selected ${selectedElement.displayName || selectedElement.type}: `
        : '';
      onSendMessage(elementContext + quickAction.prompt);
    }
  };

  // If element is selected, show element-specific actions
  if (selectedElement && elementActions.length > 0) {
    return (
      <div
        className="flex flex-col gap-2 px-4 py-3 border-t"
        style={{ borderColor: 'var(--border-color)' }}
      >
        {/* Element context label */}
        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span className="px-2 py-0.5 bg-garden-500/20 text-garden-300 rounded">
            {selectedElement.displayName || selectedElement.type}
          </span>
          <span>Quick actions:</span>
        </div>
        {/* Element-specific quick actions */}
        <div className="flex flex-wrap gap-2">
          {elementActions.map((quickAction) => (
            <button
              key={quickAction.label}
              onClick={() => handleQuickAction(quickAction)}
              className="px-3 py-1.5 rounded-lg bg-garden-600/20 hover:bg-garden-600/30 text-garden-200 text-sm font-medium transition-colors flex items-center gap-1.5 border border-garden-500/30"
            >
              {quickAction.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Default: show global actions
  if (actions.length === 0) return null;

  return (
    <div
      className="flex flex-wrap gap-2 px-4 py-3 border-t"
      style={{ borderColor: 'var(--border-color)' }}
    >
      {actions.map((action) => (
        <button
          key={action.action}
          onClick={() => onAction(action.action)}
          className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
          style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
        >
          {action.icon && <span>{action.icon}</span>}
          {action.label}
        </button>
      ))}
    </div>
  );
}

export default SuggestedActionsBar;
