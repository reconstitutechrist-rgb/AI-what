'use client';

/**
 * FigmaImportModal
 * Modal for importing designs from Figma via URL, JSON, or plugin
 */

import React, { useState, useCallback, useRef } from 'react';
import { useFigmaImport } from '@/hooks/useFigmaImport';
import type { LayoutDesign } from '@/types/layoutDesign';

interface FigmaImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (design: Partial<LayoutDesign>) => void;
}

type TabType = 'url' | 'json' | 'plugin';

export function FigmaImportModal({ isOpen, onClose, onImportComplete }: FigmaImportModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('url');
  const [urlInput, setUrlInput] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    isImporting,
    progress,
    importedDesign,
    error,
    warnings,
    importFromUrl,
    importFromJson,
    validateUrl,
    reset,
  } = useFigmaImport();

  const handleClose = useCallback(() => {
    reset();
    setUrlInput('');
    setJsonInput('');
    onClose();
  }, [reset, onClose]);

  const handleUrlImport = useCallback(async () => {
    if (!urlInput.trim()) return;

    const design = await importFromUrl(urlInput.trim());
    if (design) {
      // Don't auto-apply, let user confirm
    }
  }, [urlInput, importFromUrl]);

  const handleJsonImport = useCallback(async () => {
    if (!jsonInput.trim()) return;

    const design = await importFromJson(jsonInput.trim());
    if (design) {
      // Don't auto-apply, let user confirm
    }
  }, [jsonInput, importFromJson]);

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const text = await file.text();
      setJsonInput(text);

      // Auto-import after file load
      const design = await importFromJson(text);
      if (design) {
        // Don't auto-apply, let user confirm
      }
    },
    [importFromJson]
  );

  const handleApplyDesign = useCallback(() => {
    if (importedDesign) {
      onImportComplete(importedDesign);
      handleClose();
    }
  }, [importedDesign, onImportComplete, handleClose]);

  const isUrlValid = urlInput.trim() && validateUrl(urlInput.trim());

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl mx-4 bg-slate-900 rounded-xl shadow-2xl border border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <FigmaIcon className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-white">Import from Figma</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700">
          <TabButton active={activeTab === 'url'} onClick={() => setActiveTab('url')}>
            From URL
          </TabButton>
          <TabButton active={activeTab === 'json'} onClick={() => setActiveTab('json')}>
            From JSON
          </TabButton>
          <TabButton active={activeTab === 'plugin'} onClick={() => setActiveTab('plugin')}>
            Using Plugin
          </TabButton>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'url' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Figma File URL
                </label>
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://www.figma.com/file/..."
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={isImporting}
                />
                {urlInput && !isUrlValid && (
                  <p className="mt-2 text-sm text-amber-400">
                    Please enter a valid Figma URL (figma.com/file/... or figma.com/design/...)
                  </p>
                )}
              </div>

              <div className="bg-slate-800/50 rounded-lg p-4 text-sm text-slate-400">
                <p className="font-medium text-slate-300 mb-2">Note:</p>
                <p>
                  URL import requires a Figma API token configured on the server. For private files,
                  use the Figma plugin or export JSON manually.
                </p>
              </div>

              <button
                onClick={handleUrlImport}
                disabled={!isUrlValid || isImporting}
                className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium rounded-lg transition-colors"
              >
                {isImporting ? 'Importing...' : 'Import from URL'}
              </button>
            </div>
          )}

          {activeTab === 'json' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Paste JSON or Upload File
                </label>
                <textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder='{"documentName": "My Design", "colors": [...], ...}'
                  rows={8}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                  disabled={isImporting}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImporting}
                  className="flex-1 py-3 px-4 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <UploadIcon className="w-4 h-4" />
                  Upload JSON File
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <button
                  onClick={handleJsonImport}
                  disabled={!jsonInput.trim() || isImporting}
                  className="flex-1 py-3 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium rounded-lg transition-colors"
                >
                  {isImporting ? 'Importing...' : 'Import JSON'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'plugin' && (
            <div className="space-y-4">
              <div className="bg-slate-800/50 rounded-lg p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <FigmaIcon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  AI App Builder Sync Plugin
                </h3>
                <p className="text-slate-400 text-sm mb-4">
                  Install our Figma plugin to extract designs directly from your Figma files.
                </p>
                <div className="space-y-3 text-left text-sm text-slate-300">
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-medium">
                      1
                    </span>
                    <span>
                      Open Figma and go to Plugins → Development → Import plugin from manifest
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-medium">
                      2
                    </span>
                    <span>
                      Select the{' '}
                      <code className="px-1 py-0.5 bg-slate-700 rounded">
                        figma-plugin/manifest.json
                      </code>{' '}
                      file from the project
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-medium">
                      3
                    </span>
                    <span>Select a frame in Figma and run the plugin</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-medium">
                      4
                    </span>
                    <span>Click &quot;Send to AI App Builder&quot; in the plugin</span>
                  </div>
                </div>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-sm text-amber-200">
                <strong>Development Mode:</strong> The plugin is currently in development mode.
                You&apos;ll need to load it manually from the manifest.json file.
              </div>
            </div>
          )}

          {/* Progress */}
          {progress && progress.stage !== 'complete' && progress.stage !== 'error' && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
                <span>{progress.message}</span>
                <span>{progress.progress}%</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 transition-all duration-300"
                  style={{ width: `${progress.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-200 text-sm">
              <ul className="list-disc list-inside space-y-1">
                {warnings.map((warning, i) => (
                  <li key={i}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Success / Preview */}
          {importedDesign && (
            <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <div className="flex items-center gap-2 text-green-300 mb-3">
                <CheckIcon className="w-5 h-5" />
                <span className="font-medium">Design imported successfully!</span>
              </div>

              {/* Preview of imported data */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400">Colors:</span>
                  <div className="flex gap-1 mt-1">
                    {importedDesign.globalStyles?.colors && (
                      <>
                        <ColorSwatch color={importedDesign.globalStyles.colors.primary} />
                        <ColorSwatch color={importedDesign.globalStyles.colors.secondary} />
                        <ColorSwatch color={importedDesign.globalStyles.colors.background} />
                        <ColorSwatch color={importedDesign.globalStyles.colors.text} />
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Typography:</span>
                  <div className="text-white mt-1">
                    {importedDesign.globalStyles?.typography?.fontFamily || 'Inter'}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Layout:</span>
                  <div className="text-white mt-1 capitalize">
                    {importedDesign.structure?.type || 'Standard'}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Border Radius:</span>
                  <div className="text-white mt-1">
                    {importedDesign.globalStyles?.effects?.borderRadius || 'md'}
                  </div>
                </div>
              </div>

              <button
                onClick={handleApplyDesign}
                className="mt-4 w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
              >
                Apply to Layout Builder
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Sub-components

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
        active
          ? 'text-purple-400 border-b-2 border-purple-400 bg-slate-800/50'
          : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
      }`}
    >
      {children}
    </button>
  );
}

function ColorSwatch({ color }: { color?: string }) {
  if (!color) return null;
  return (
    <div
      className="w-6 h-6 rounded border border-slate-600"
      style={{ backgroundColor: color }}
      title={color}
    />
  );
}

// Icons

function FigmaIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M5 5.5A3.5 3.5 0 018.5 2H12v7H8.5A3.5 3.5 0 015 5.5zM12 2h3.5a3.5 3.5 0 110 7H12V2z" />
      <path d="M12 12.5a3.5 3.5 0 117 0 3.5 3.5 0 11-7 0z" />
      <path d="M5 19.5A3.5 3.5 0 018.5 16H12v3.5a3.5 3.5 0 11-7 0zM5 12.5A3.5 3.5 0 018.5 9H12v7H8.5A3.5 3.5 0 015 12.5z" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default FigmaImportModal;
