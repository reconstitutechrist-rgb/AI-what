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
          className="rounded-xl max-w-md w-full shadow-2xl"
          style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-garden-600/20 flex items-center justify-center">
                <FolderIcon size={20} className="text-garden-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Name Your App
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Give your project a memorable name
                </p>
              </div>
            </div>
          </div>

          {/* Modal Content */}
          <div className="px-6 py-5">
            <label
              htmlFor="app-name-input"
              className="text-sm font-medium mb-2 block"
              style={{ color: 'var(--text-secondary)' }}
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
              className="w-full px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-garden-500 focus:border-transparent"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
              }}
              autoFocus
            />
            {error && (
              <p className="text-sm mt-2" style={{ color: 'var(--error)' }}>
                {error}
              </p>
            )}
          </div>

          {/* Modal Actions */}
          <div
            className="px-6 py-4 flex gap-3"
            style={{ borderTop: '1px solid var(--border-color)' }}
          >
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
