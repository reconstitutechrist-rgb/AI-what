'use client';

import React, { useState, useRef, useEffect } from 'react';

interface TemplatesMenuProps {
  onOpenTemplates: () => void;
  onOpenBlueprints: () => void;
  onOpenHistory: () => void;
  historyCount?: number;
}

/**
 * Dropdown menu for Templates, Blueprints, and History
 */
export function TemplatesMenu({
  onOpenTemplates,
  onOpenBlueprints,
  onOpenHistory,
  historyCount = 0,
}: TemplatesMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close menu on escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const handleItemClick = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-2 ${
          isOpen
            ? 'bg-slate-700 text-white'
            : 'text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700'
        }`}
        title="Templates & History"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
          />
        </svg>
        Templates
        <svg
          className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 py-1 overflow-hidden">
          <button
            onClick={() => handleItemClick(onOpenTemplates)}
            className="w-full px-3 py-2.5 text-left text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-3"
          >
            <svg
              className="w-4 h-4 text-garden-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
              />
            </svg>
            <div>
              <div className="font-medium">Browse Templates</div>
              <div className="text-xs text-slate-500">Pre-built design layouts</div>
            </div>
          </button>

          <button
            onClick={() => handleItemClick(onOpenBlueprints)}
            className="w-full px-3 py-2.5 text-left text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-3"
          >
            <svg
              className="w-4 h-4 text-gold-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <div>
              <div className="font-medium">Architecture Blueprints</div>
              <div className="text-xs text-slate-500">App structure patterns</div>
            </div>
          </button>

          <div className="border-t border-slate-700 my-1" />

          <button
            onClick={() => handleItemClick(onOpenHistory)}
            className="w-full px-3 py-2.5 text-left text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-3"
          >
            <svg
              className="w-4 h-4 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <div className="font-medium">Version History</div>
              <div className="text-xs text-slate-500">Restore previous versions</div>
            </div>
            {historyCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] bg-garden-600 text-white rounded-full">
                {historyCount > 9 ? '9+' : historyCount}
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default TemplatesMenu;
