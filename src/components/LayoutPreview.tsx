/**
 * Layout Preview (The Seeing Canvas)
 *
 * Wraps the DynamicLayoutRenderer with the "Vision Loop" logic.
 * - Handles file uploads (drag & drop)
 * - Captures screenshots for AI Critique
 * - Displays the layout
 */

import React, { useRef, useState } from 'react';
import { DynamicLayoutRenderer } from './layout-builder/DynamicLayoutRenderer';
import { useLayoutBuilder } from '@/hooks/useLayoutBuilder';

import { FloatingEditBubble } from './layout-builder/FloatingEditBubble';

export const LayoutPreview: React.FC = () => {
  const {
    components,
    selectedId,
    selectComponent,
    analyzeImage,
    analyzeVideo,
    isAnalyzing,
    applyAIEdit,
    deleteComponent,
    duplicateComponent,
    undo,
    redo,
    exportCode,
    saveToWizard,
    generatePhasePlan,
    canUndo,
    canRedo,
  } = useLayoutBuilder();

  const [dragActive, setDragActive] = useState(false);
  const layoutRef = useRef<HTMLDivElement>(null);

  // Helper to find selected component data
  const selectedComponent = components.find((c) => c.id === selectedId);

  // --- Upload Handlers ---
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('video/')) {
        await analyzeVideo(file);
      } else {
        await analyzeImage(file);
      }
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-gray-50">
      {/* Toolbar / Status */}
      <div className="h-14 border-b bg-white flex items-center px-4 justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-sm text-gray-700">Interactive Canvas</span>
          {isAnalyzing && (
            <span className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              AI Analyzing...
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* History Controls */}
          <div className="flex gap-2">
            <button
              onClick={undo}
              disabled={!canUndo}
              className={`p-2 rounded hover:bg-white/10 ${!canUndo ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Undo"
            >
              ↩
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className={`p-2 rounded hover:bg-white/10 ${!canRedo ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Redo"
            >
              ↪
            </button>
          </div>

          <button
            onClick={exportCode}
            disabled={components.length === 0}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg disabled:opacity-50 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            Export React
          </button>

          <button
            onClick={async () => {
              try {
                // 1. Generate Plan
                await generatePhasePlan();

                // 2. Switch Mode & Redirect
                const { useAppStore } = await import('@/store/useAppStore');
                useAppStore.getState().setCurrentMode('ACT');
                useAppStore.getState().setActiveTab('chat');

                // 3. Navigate
                // We need Next.js router here.
                // Since we are in a client component, we should strictly use `useRouter`.
                // However, we are inside an onClick handler.
                window.location.href = '/app';
              } catch (error) {
                console.error('Build Failed:', error);
                alert('Failed to generate build plan. See console.');
              }
            }}
            disabled={components.length === 0 || isAnalyzing}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all
                ${components.length === 0 || isAnalyzing ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md active:scale-95'}
              `}
          >
            {isAnalyzing ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Building...
              </>
            ) : (
              <>
                <span>✨</span>
                Build App
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div
        className={`flex-1 overflow-auto p-8 relative transition-colors ${dragActive ? 'bg-blue-50' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => selectComponent(null)} // Deselect on background click
      >
        <div
          ref={layoutRef}
          className="min-h-[800px] w-full bg-white shadow-sm ring-1 ring-gray-200 rounded-md relative"
        >
          <DynamicLayoutRenderer
            components={components}
            onSelectComponent={selectComponent}
            selectedComponentId={selectedId}
          />

          {/* Edit Bubble Overlay */}
          {selectedComponent && (
            <FloatingEditBubble
              component={selectedComponent}
              onClose={() => selectComponent(null)}
              onAiEdit={applyAIEdit}
              onDelete={deleteComponent}
              onDuplicate={duplicateComponent}
            />
          )}
        </div>

        {/* Drag Overlay Help Text */}
        {components.length === 0 && !isAnalyzing && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center p-6 bg-white/80 backdrop-blur rounded-xl border border-gray-200 shadow-lg">
              <p className="text-lg font-medium text-gray-900">Drop an Image or Video</p>
              <p className="text-sm text-gray-500">The AI will analyze and replicate it.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
