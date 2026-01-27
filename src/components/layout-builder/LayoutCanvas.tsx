/**
 * Layout Canvas (Stateless Preview Component)
 *
 * A stateless canvas component that displays the layout preview.
 * All state is managed by the parent component and passed via props.
 *
 * Features:
 * - Drag & drop file upload
 * - Component selection
 * - Floating edit bubble for selected components
 * - Undo/redo controls
 * - Export functionality
 */

import React, { useRef, useState } from 'react';
import { DynamicLayoutRenderer } from './DynamicLayoutRenderer';
import { FloatingEditBubble } from './FloatingEditBubble';
import { DetectedComponentEnhanced } from '@/types/layoutDesign';

export interface LayoutCanvasProps {
  components: DetectedComponentEnhanced[];
  selectedId: string | null;
  isAnalyzing: boolean;
  onSelectComponent: (id: string | null) => void;
  onAnalyzeImage: (file: File, instructions?: string) => Promise<void>;
  onAnalyzeVideo: (file: File, instructions?: string) => Promise<void>;
  onApplyAIEdit: (id: string, prompt: string) => Promise<void>;
  onDeleteComponent: (id: string) => void;
  onDuplicateComponent: (id: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onExportCode: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export const LayoutCanvas: React.FC<LayoutCanvasProps> = ({
  components,
  selectedId,
  isAnalyzing,
  onSelectComponent,
  onAnalyzeImage,
  onAnalyzeVideo,
  onApplyAIEdit,
  onDeleteComponent,
  onDuplicateComponent,
  onUndo,
  onRedo,
  onExportCode,
  canUndo,
  canRedo,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const layoutRef = useRef<HTMLDivElement>(null);

  // Debug: Log when components change
  console.log('[LayoutCanvas] Rendering with', components.length, 'components');

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
        await onAnalyzeVideo(file);
      } else {
        await onAnalyzeImage(file);
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
              onClick={onUndo}
              disabled={!canUndo}
              className={`p-2 rounded hover:bg-gray-100 ${!canUndo ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Undo"
            >
              ↩
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className={`p-2 rounded hover:bg-gray-100 ${!canRedo ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Redo"
            >
              ↪
            </button>
          </div>

          <button
            onClick={onExportCode}
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
        </div>
      </div>

      {/* Main Canvas Area */}
      <div
        className={`flex-1 overflow-auto p-8 relative transition-colors ${dragActive ? 'bg-blue-50' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => onSelectComponent(null)} // Deselect on background click
      >
        <div
          ref={layoutRef}
          className="min-h-[800px] w-full bg-white shadow-sm ring-1 ring-gray-200 rounded-md relative"
        >
          <DynamicLayoutRenderer
            components={components}
            onSelectComponent={onSelectComponent}
            selectedComponentId={selectedId}
          />

          {/* Edit Bubble Overlay */}
          {selectedComponent && (
            <FloatingEditBubble
              component={selectedComponent}
              onClose={() => onSelectComponent(null)}
              onAiEdit={onApplyAIEdit}
              onDelete={onDeleteComponent}
              onDuplicate={onDuplicateComponent}
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

export default LayoutCanvas;
