/**
 * MultiPageUploadZone Component
 *
 * Multi-page upload zone for exact layout replication.
 * - Drag-drop multiple images at once
 * - Page naming/labeling UI
 * - Reorder pages via drag
 * - Thumbnail preview with analysis status indicator
 * - "Analyze All Pages" button
 */

'use client';

import React, { useState, useCallback, useRef } from 'react';
import {
  UploadIcon,
  ImageIcon,
  XIcon,
  CheckIcon,
  AlertIcon,
  GripVerticalIcon,
  PlusIcon,
  SparklesIcon,
} from '../ui/Icons';
import type { PageReference } from '@/types/layoutDesign';

// ============================================================================
// TYPES
// ============================================================================

interface MultiPageUploadZoneProps {
  /** Current page references */
  pages: PageReference[];
  /** Callback when pages are added */
  onPagesAdd: (pages: Omit<PageReference, 'analysis'>[]) => void;
  /** Callback when a page is removed */
  onPageRemove: (pageId: string) => void;
  /** Callback when pages are reordered */
  onPagesReorder: (sourceIndex: number, destIndex: number) => void;
  /** Callback when a page name is updated */
  onPageNameChange: (pageId: string, name: string) => void;
  /** Callback to trigger analysis of all pages */
  onAnalyzeAllPages: () => void;
  /** Whether analysis is in progress */
  isAnalyzing?: boolean;
  /** Maximum number of pages allowed */
  maxPages?: number;
  /** Custom class name */
  className?: string;
}

interface DragState {
  isDragging: boolean;
  dragIndex: number | null;
  dropIndex: number | null;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_IMAGE_SIZE_MB = 10;
const DEFAULT_MAX_PAGES = 10;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function generatePageId(): string {
  return `page_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function createThumbnail(dataUrl: string, maxWidth: number = 200): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ratio = maxWidth / img.width;
      canvas.width = maxWidth;
      canvas.height = img.height * ratio;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => resolve(dataUrl); // Fallback to original
    img.src = dataUrl;
  });
}

// ============================================================================
// STATUS BADGE COMPONENT
// ============================================================================

function StatusBadge({ status }: { status: PageReference['status'] }) {
  const configs = {
    pending: {
      bg: 'bg-gray-500/20',
      text: 'text-gray-400',
      icon: null,
      label: 'Pending',
    },
    analyzing: {
      bg: 'bg-gold-500/20',
      text: 'text-gold-400',
      icon: (
        <div className="w-3 h-3 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
      ),
      label: 'Analyzing',
    },
    complete: {
      bg: 'bg-green-500/20',
      text: 'text-green-400',
      icon: <CheckIcon className="w-3 h-3" />,
      label: 'Complete',
    },
    error: {
      bg: 'bg-red-500/20',
      text: 'text-red-400',
      icon: <AlertIcon className="w-3 h-3" />,
      label: 'Error',
    },
  };

  const config = configs[status];

  return (
    <div
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${config.bg} ${config.text}`}
    >
      {config.icon}
      <span>{config.label}</span>
    </div>
  );
}

// ============================================================================
// PAGE CARD COMPONENT
// ============================================================================

interface PageCardProps {
  page: PageReference;
  index: number;
  isEditing: boolean;
  editValue: string;
  onStartEdit: () => void;
  onEditChange: (value: string) => void;
  onEditSubmit: () => void;
  onRemove: () => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  isDragTarget: boolean;
}

function PageCard({
  page,
  index,
  isEditing,
  editValue,
  onStartEdit,
  onEditChange,
  onEditSubmit,
  onRemove,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragTarget,
}: PageCardProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onEditSubmit();
    } else if (e.key === 'Escape') {
      onEditSubmit();
    }
  };

  return (
    <div
      className={`relative group rounded-lg border overflow-hidden transition-all ${
        isDragTarget ? 'border-gold-500 ring-2 ring-gold-500/30' : ''
      }`}
      style={{
        background: 'var(--bg-secondary)',
        borderColor: isDragTarget ? 'var(--gold-500, #eab308)' : 'var(--border-color)',
      }}
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragEnd={onDragEnd}
    >
      {/* Drag Handle */}
      <div
        className="absolute top-2 left-2 p-1 rounded bg-black/40 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity z-10"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <GripVerticalIcon className="w-3 h-3 text-white" />
      </div>

      {/* Remove Button */}
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 p-1 rounded bg-black/40 hover:bg-red-500/80 opacity-0 group-hover:opacity-100 transition-all z-10"
      >
        <XIcon className="w-3 h-3 text-white" />
      </button>

      {/* Thumbnail */}
      <div className="aspect-video relative" style={{ background: 'var(--bg-tertiary)' }}>
        <img
          src={page.thumbnail || page.referenceImage}
          alt={page.name}
          className="w-full h-full object-cover"
        />
        {/* Order indicator */}
        <div className="absolute bottom-2 left-2 w-5 h-5 rounded bg-black/60 flex items-center justify-center">
          <span className="text-[10px] text-white font-medium">{index + 1}</span>
        </div>
        {/* Status indicator */}
        <div className="absolute bottom-2 right-2">
          <StatusBadge status={page.status} />
        </div>
        {/* Main page badge */}
        {page.isMain && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-gold-500 text-white text-[10px] font-medium">
            Main
          </div>
        )}
      </div>

      {/* Page Name */}
      <div className="p-2">
        {isEditing ? (
          <input
            type="text"
            value={editValue}
            onChange={(e) => onEditChange(e.target.value)}
            onBlur={onEditSubmit}
            onKeyDown={handleKeyDown}
            autoFocus
            className="w-full px-1.5 py-0.5 text-sm rounded border bg-transparent outline-none"
            style={{
              color: 'var(--text-primary)',
              borderColor: 'var(--gold-500, #eab308)',
            }}
          />
        ) : (
          <button
            onClick={onStartEdit}
            className="w-full text-left text-sm font-medium truncate hover:text-gold-400 transition-colors"
            style={{ color: 'var(--text-primary)' }}
          >
            {page.name}
          </button>
        )}
        <p className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
          /{page.slug}
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function MultiPageUploadZone({
  pages,
  onPagesAdd,
  onPageRemove,
  onPagesReorder,
  onPageNameChange,
  onAnalyzeAllPages,
  isAnalyzing = false,
  maxPages = DEFAULT_MAX_PAGES,
  className = '',
}: MultiPageUploadZoneProps) {
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragIndex: null,
    dropIndex: null,
  });
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canAddMore = pages.length < maxPages;
  const hasPages = pages.length > 0;
  const pendingCount = pages.filter((p) => p.status === 'pending').length;
  const analyzingCount = pages.filter((p) => p.status === 'analyzing').length;
  const completeCount = pages.filter((p) => p.status === 'complete').length;

  // Process multiple files
  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      setError(null);
      const fileArray = Array.from(files);

      // Check max pages
      if (pages.length + fileArray.length > maxPages) {
        setError(`Cannot add ${fileArray.length} pages. Maximum is ${maxPages} pages.`);
        return;
      }

      // Filter valid images
      const validFiles = fileArray.filter((file) => {
        if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
          return false;
        }
        if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
          return false;
        }
        return true;
      });

      if (validFiles.length === 0) {
        setError('No valid images found. Supported formats: JPG, PNG, GIF, WebP (max 10MB)');
        return;
      }

      if (validFiles.length !== fileArray.length) {
        setError(
          `${fileArray.length - validFiles.length} file(s) skipped (unsupported format or too large)`
        );
      }

      setIsProcessing(true);

      try {
        const newPages: Omit<PageReference, 'analysis'>[] = [];

        for (let i = 0; i < validFiles.length; i++) {
          const file = validFiles[i];
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          const thumbnail = await createThumbnail(dataUrl);
          const baseName = file.name.replace(/\.[^/.]+$/, '');
          const pageName =
            baseName
              .replace(/[-_]/g, ' ')
              .replace(/\b\w/g, (l) => l.toUpperCase())
              .trim() || `Page ${pages.length + i + 1}`;

          newPages.push({
            id: generatePageId(),
            name: pageName,
            slug: generateSlug(pageName),
            referenceImage: dataUrl,
            thumbnail,
            order: pages.length + i,
            isMain: pages.length === 0 && i === 0,
            status: 'pending',
            createdAt: new Date().toISOString(),
          });
        }

        onPagesAdd(newPages);
      } catch (err) {
        setError('Failed to process one or more images');
        console.error('Failed to process images:', err);
      } finally {
        setIsProcessing(false);
      }
    },
    [pages, maxPages, onPagesAdd]
  );

  // Handle file drop
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDraggingFile(false);

      if (e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
      }
    },
    [processFiles]
  );

  // Handle file input change
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        processFiles(e.target.files);
      }
      e.target.value = ''; // Reset for re-upload
    },
    [processFiles]
  );

  // Page reordering drag handlers
  const handlePageDragStart = useCallback((e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    setDragState({ isDragging: true, dragIndex: index, dropIndex: null });
  }, []);

  const handlePageDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      if (dragState.dragIndex !== null && dragState.dragIndex !== index) {
        setDragState((prev) => ({ ...prev, dropIndex: index }));
      }
    },
    [dragState.dragIndex]
  );

  const handlePageDragEnd = useCallback(() => {
    if (dragState.dragIndex !== null && dragState.dropIndex !== null) {
      onPagesReorder(dragState.dragIndex, dragState.dropIndex);
    }
    setDragState({ isDragging: false, dragIndex: null, dropIndex: null });
  }, [dragState, onPagesReorder]);

  // Page name editing handlers
  const startEditing = useCallback((page: PageReference) => {
    setEditingPageId(page.id);
    setEditValue(page.name);
  }, []);

  const submitEdit = useCallback(() => {
    if (editingPageId && editValue.trim()) {
      onPageNameChange(editingPageId, editValue.trim());
    }
    setEditingPageId(null);
    setEditValue('');
  }, [editingPageId, editValue, onPageNameChange]);

  // Empty state / dropzone
  if (!hasPages) {
    return (
      <div className={className}>
        <div
          className={`relative border-2 border-dashed rounded-lg cursor-pointer transition-all p-8`}
          style={{
            borderColor: isDraggingFile ? 'var(--gold-500, #eab308)' : 'var(--border-color)',
            background: isDraggingFile ? 'rgba(234, 179, 8, 0.1)' : 'transparent',
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingFile(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDraggingFile(false);
          }}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(',')}
            multiple
            className="hidden"
            onChange={handleFileChange}
          />

          {isProcessing ? (
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Processing images...
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ background: 'var(--bg-secondary)' }}
              >
                <UploadIcon className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />
              </div>
              <p className="text-base font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                Drop page screenshots here
              </p>
              <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
                or click to browse
              </p>
              <div
                className="flex items-center gap-4 text-xs"
                style={{ color: 'var(--text-muted)' }}
              >
                <span className="flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" />
                  JPG, PNG, GIF, WebP
                </span>
                <span>Up to {maxPages} pages</span>
                <span>Max {MAX_IMAGE_SIZE_MB}MB each</span>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-3 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}
      </div>
    );
  }

  // Pages grid with controls
  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Pages ({pages.length}/{maxPages})
          </h3>
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            {pendingCount > 0 && <span>{pendingCount} pending</span>}
            {analyzingCount > 0 && <span>{analyzingCount} analyzing</span>}
            {completeCount > 0 && <span className="text-green-400">{completeCount} complete</span>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canAddMore && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
            >
              <PlusIcon className="w-4 h-4" />
              Add Pages
            </button>
          )}

          {pendingCount > 0 && (
            <button
              onClick={onAnalyzeAllPages}
              disabled={isAnalyzing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              style={{ background: 'var(--gold-500, #eab308)', color: 'white' }}
            >
              {isAnalyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <SparklesIcon className="w-4 h-4" />
                  Analyze All
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(',')}
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Pages Grid */}
      <div
        className="grid gap-3"
        style={{
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        }}
      >
        {pages.map((page, index) => (
          <PageCard
            key={page.id}
            page={page}
            index={index}
            isEditing={editingPageId === page.id}
            editValue={editValue}
            onStartEdit={() => startEditing(page)}
            onEditChange={setEditValue}
            onEditSubmit={submitEdit}
            onRemove={() => onPageRemove(page.id)}
            onDragStart={handlePageDragStart}
            onDragOver={handlePageDragOver}
            onDragEnd={handlePageDragEnd}
            isDragTarget={dragState.dropIndex === index}
          />
        ))}

        {/* Add more card */}
        {canAddMore && (
          <div
            className={`relative border-2 border-dashed rounded-lg cursor-pointer transition-all flex flex-col items-center justify-center min-h-[160px]`}
            style={{
              borderColor: isDraggingFile ? 'var(--gold-500, #eab308)' : 'var(--border-color)',
              background: isDraggingFile ? 'rgba(234, 179, 8, 0.1)' : 'transparent',
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingFile(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsDraggingFile(false);
            }}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <PlusIcon className="w-6 h-6 mb-1" style={{ color: 'var(--text-muted)' }} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Add more pages
            </span>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-3 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-3 text-xs text-center" style={{ color: 'var(--text-muted)' }}>
        Drag to reorder • Click name to edit • First page is the main page
      </div>
    </div>
  );
}

export default MultiPageUploadZone;
