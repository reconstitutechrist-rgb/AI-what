'use client';

import React, { useState, useCallback } from 'react';
import { FolderIcon, XIcon, CheckIcon } from '../ui/Icons';
import { FocusTrap } from '../ui/FocusTrap';

export interface NameAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
}

export function NameAppModal({ isOpen, onClose, onSubmit }: NameAppModalProps) {
  const [appName, setAppName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = useCallback(() => {
    const trimmedName = appName.trim();
    if (!trimmedName) {
      setError('Please enter an app name');
      return;
    }
    onSubmit(trimmedName);
    setAppName('');
    setError('');
  }, [appName, onSubmit]);

  const handleClose = useCallback(() => {
    setAppName('');
    setError('');
    onClose();
  }, [onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <FocusTrap onEscape={handleClose}>
        <div
          className="bg-slate-900 rounded-xl border border-slate-800 max-w-md w-full shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-garden-600/20 flex items-center justify-center">
                <FolderIcon size={20} className="text-garden-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-100">Name Your App</h3>
                <p className="text-sm text-slate-400">Give your project a memorable name</p>
              </div>
            </div>
          </div>

          {/* Modal Content */}
          <div className="px-6 py-5">
            <label
              htmlFor="app-name-input"
              className="text-sm font-medium text-slate-300 mb-2 block"
            >
              App Name
            </label>
            <input
              id="app-name-input"
              type="text"
              value={appName}
              onChange={(e) => {
                setAppName(e.target.value);
                if (error) setError('');
              }}
              onKeyDown={handleKeyDown}
              placeholder="My Awesome App"
              className="w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-garden-500 focus:border-transparent"
              autoFocus
            />
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          </div>

          {/* Modal Actions */}
          <div className="px-6 py-4 border-t border-slate-800 flex gap-3">
            <button onClick={handleClose} className="btn-secondary flex-1 py-2.5">
              <XIcon size={16} />
              Cancel
            </button>
            <button onClick={handleSubmit} className="btn-primary flex-1 py-2.5">
              <CheckIcon size={16} />
              Create App
            </button>
          </div>
        </div>
      </FocusTrap>
    </div>
  );
}

export default NameAppModal;
