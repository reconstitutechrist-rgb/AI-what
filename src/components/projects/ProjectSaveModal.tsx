import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

interface ProjectSaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
  initialName?: string;
}

export function ProjectSaveModal({ isOpen, onClose, onSave, initialName = '' }: ProjectSaveModalProps) {
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);

  // Sync name when modal opens with a new initialName
  useEffect(() => {
    if (isOpen) {
      setName(initialName);
    }
  }, [isOpen, initialName]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setSaving(true);
      await onSave(name);
      onClose();
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 p-4 dark:border-slate-800">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Save Project</h3>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Project Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome App"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Project
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
