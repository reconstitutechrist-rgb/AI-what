/**
 * Floating Edit Bubble
 *
 * A contextual UI that appears next to a selected component in the Sandpack preview.
 * Uses the Live Editor prompt for quick edits — sends the selected outerHTML +
 * user instruction to the AI, gets back updated code.
 *
 * Positioned using the inspector bridge's selectedRect (relative to the
 * Sandpack container element).
 */

import React, { useState, useEffect, useRef } from 'react';

interface FloatingEditBubbleProps {
  /** data-id of the selected component */
  dataId: string;
  /** Tag name of the selected component */
  componentType: string;
  /** outerHTML of the selected component */
  outerHTML: string;
  /** Bounding rect from the inspector bridge (relative to iframe) */
  rect: { top: number; left: number; width: number; height: number };
  /** Offset of the Sandpack container from the viewport */
  containerOffset: { top: number; left: number };
  /** Called when the user submits an edit instruction */
  onRefine: (dataId: string, prompt: string, outerHTML: string) => Promise<void>;
  /** Close the bubble */
  onClose: () => void;
}

export const FloatingEditBubble: React.FC<FloatingEditBubbleProps> = ({
  dataId,
  componentType,
  outerHTML,
  rect,
  containerOffset,
  onRefine,
  onClose,
}) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when bubble opens
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    try {
      await onRefine(dataId, prompt, outerHTML);
      setPrompt('');
      onClose();
    } catch (error) {
      console.error('[FloatingEditBubble] Edit failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Position: above the selected element, centered horizontally
  // rect is relative to the iframe viewport, so we add the container offset
  // Flip to below when the element is too close to the top (e.g., Navbar)
  const isTooCloseToTop = rect.top < 150;

  const style: React.CSSProperties = {
    position: 'absolute',
    top: `${containerOffset.top + rect.top + (isTooCloseToTop ? rect.height + 10 : 0)}px`,
    left: `${containerOffset.left + rect.left + rect.width / 2}px`,
    transform: isTooCloseToTop ? 'translate(-50%, 0)' : 'translate(-50%, -110%)',
    marginTop: isTooCloseToTop ? '8px' : '-8px',
    zIndex: 1000,
  };

  return (
    <div
      style={style}
      className="bg-white shadow-xl rounded-lg border border-gray-200 p-3 w-[280px] animate-in fade-in zoom-in-95 duration-200"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Edit &lt;{componentType}&gt;
        </span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
          &times;
        </button>
      </div>

      {/* AI Input Form */}
      <form onSubmit={handleSubmit} className="mb-2">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            className="w-full pl-3 pr-8 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Make this blue..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className="absolute right-1 top-1 p-1 text-blue-600 hover:text-blue-800 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            )}
          </button>
        </div>
      </form>

      {/* data-id indicator */}
      <div className="text-[10px] text-gray-400 truncate">data-id: {dataId}</div>
    </div>
  );
};
