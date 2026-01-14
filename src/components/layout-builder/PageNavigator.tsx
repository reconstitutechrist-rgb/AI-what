/**
 * PageNavigator Component
 *
 * Tab-based page switcher for multi-page layout preview.
 * - Thumbnails with active indicator
 * - Add/reorder/delete pages
 * - Sync with detected navigation
 * - Horizontal scrolling for many pages
 */

'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  PlusIcon,
  XIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HomeIcon,
  CheckIcon,
} from '../ui/Icons';
import type { PageReference } from '@/types/layoutDesign';

// ============================================================================
// TYPES
// ============================================================================

interface PageNavigatorProps {
  /** All pages in the multi-page design */
  pages: PageReference[];
  /** Currently active page ID */
  currentPageId: string | null;
  /** Callback when a page is selected */
  onPageSelect: (pageId: string) => void;
  /** Callback when a page is removed */
  onPageRemove?: (pageId: string) => void;
  /** Callback to add a new page */
  onAddPage?: () => void;
  /** Callback when pages are reordered */
  onPagesReorder?: (sourceIndex: number, destIndex: number) => void;
  /** Whether the navigator is in compact mode */
  compact?: boolean;
  /** Whether to show add button */
  showAddButton?: boolean;
  /** Whether to allow removing pages */
  allowRemove?: boolean;
  /** Custom class name */
  className?: string;
}

// ============================================================================
// PAGE TAB COMPONENT
// ============================================================================

interface PageTabProps {
  page: PageReference;
  index: number;
  isActive: boolean;
  onSelect: () => void;
  onRemove?: () => void;
  allowRemove: boolean;
  compact: boolean;
  onDragStart?: (e: React.DragEvent, index: number) => void;
  onDragOver?: (e: React.DragEvent, index: number) => void;
  onDragEnd?: () => void;
  isDragTarget?: boolean;
}

function PageTab({
  page,
  index,
  isActive,
  onSelect,
  onRemove,
  allowRemove,
  compact,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragTarget,
}: PageTabProps) {
  const showRemove = allowRemove && onRemove && !page.isMain;

  return (
    <div
      className={`relative group flex-shrink-0 cursor-pointer transition-all ${
        isDragTarget ? 'ring-2 ring-gold-500/50' : ''
      }`}
      draggable={!!onDragStart}
      onDragStart={(e) => onDragStart?.(e, index)}
      onDragOver={(e) => onDragOver?.(e, index)}
      onDragEnd={onDragEnd}
      onClick={onSelect}
    >
      {/* Tab Container */}
      <div
        className={`flex items-center gap-2 rounded-t-lg border-b-2 transition-all ${
          compact ? 'px-2 py-1.5' : 'px-3 py-2'
        }`}
        style={{
          background: isActive ? 'var(--bg-secondary)' : 'transparent',
          borderColor: isActive ? 'var(--gold-500, #eab308)' : 'transparent',
        }}
      >
        {/* Thumbnail (non-compact mode) */}
        {!compact && (
          <div
            className="w-10 h-6 rounded overflow-hidden flex-shrink-0"
            style={{ background: 'var(--bg-tertiary)' }}
          >
            <img
              src={page.thumbnail || page.referenceImage}
              alt={page.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Page Info */}
        <div className="flex items-center gap-1.5 min-w-0">
          {/* Main page indicator */}
          {page.isMain && (
            <HomeIcon
              className={`flex-shrink-0 ${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'}`}
              style={{ color: isActive ? 'var(--gold-500, #eab308)' : 'var(--text-muted)' }}
            />
          )}

          {/* Page name */}
          <span
            className={`truncate font-medium ${compact ? 'text-xs max-w-[60px]' : 'text-sm max-w-[100px]'}`}
            style={{
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
            }}
          >
            {page.name}
          </span>

          {/* Status indicator */}
          {page.status === 'complete' && (
            <CheckIcon className="w-3 h-3 flex-shrink-0 text-green-400" />
          )}
          {page.status === 'analyzing' && (
            <div className="w-3 h-3 border border-gold-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
          )}
          {page.status === 'error' && (
            <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
          )}
        </div>

        {/* Remove button */}
        {showRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove?.();
            }}
            className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/20 transition-all flex-shrink-0"
          >
            <XIcon className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PageNavigator({
  pages,
  currentPageId,
  onPageSelect,
  onPageRemove,
  onAddPage,
  onPagesReorder,
  compact = false,
  showAddButton = true,
  allowRemove = true,
  className = '',
}: PageNavigatorProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    dragIndex: number | null;
    dropIndex: number | null;
  }>({ isDragging: false, dragIndex: null, dropIndex: null });

  // Check scroll state
  const updateScrollState = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(container.scrollLeft < container.scrollWidth - container.clientWidth - 1);
  }, []);

  // Update scroll state on mount and when pages change
  useEffect(() => {
    updateScrollState();
    window.addEventListener('resize', updateScrollState);
    return () => window.removeEventListener('resize', updateScrollState);
  }, [pages, updateScrollState]);

  // Scroll handlers
  const scrollLeft = useCallback(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollBy({ left: -200, behavior: 'smooth' });
    }
  }, []);

  const scrollRight = useCallback(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollBy({ left: 200, behavior: 'smooth' });
    }
  }, []);

  // Drag handlers for reordering
  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    setDragState({ isDragging: true, dragIndex: index, dropIndex: null });
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      if (dragState.dragIndex !== null && dragState.dragIndex !== index) {
        setDragState((prev) => ({ ...prev, dropIndex: index }));
      }
    },
    [dragState.dragIndex]
  );

  const handleDragEnd = useCallback(() => {
    if (onPagesReorder && dragState.dragIndex !== null && dragState.dropIndex !== null) {
      onPagesReorder(dragState.dragIndex, dragState.dropIndex);
    }
    setDragState({ isDragging: false, dragIndex: null, dropIndex: null });
  }, [dragState, onPagesReorder]);

  // Scroll to active page when it changes
  useEffect(() => {
    if (!currentPageId || !scrollContainerRef.current) return;

    const activeIndex = pages.findIndex((p) => p.id === currentPageId);
    if (activeIndex === -1) return;

    const container = scrollContainerRef.current;
    const tabs = container.children;
    if (tabs[activeIndex]) {
      const tab = tabs[activeIndex] as HTMLElement;
      const tabLeft = tab.offsetLeft;
      const tabRight = tabLeft + tab.offsetWidth;
      const containerLeft = container.scrollLeft;
      const containerRight = containerLeft + container.clientWidth;

      if (tabLeft < containerLeft) {
        container.scrollTo({ left: tabLeft - 16, behavior: 'smooth' });
      } else if (tabRight > containerRight) {
        container.scrollTo({
          left: tabRight - container.clientWidth + 16,
          behavior: 'smooth',
        });
      }
    }
  }, [currentPageId, pages]);

  if (pages.length === 0) {
    return null;
  }

  return (
    <div
      className={`relative flex items-center ${className}`}
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* Scroll Left Button */}
      {canScrollLeft && (
        <button
          onClick={scrollLeft}
          className="absolute left-0 z-10 p-1 rounded-r-lg transition-colors"
          style={{
            background: 'linear-gradient(to right, var(--bg-primary) 70%, transparent)',
          }}
        >
          <ChevronLeftIcon className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
        </button>
      )}

      {/* Tabs Container */}
      <div
        ref={scrollContainerRef}
        className="flex items-end gap-1 overflow-x-auto scrollbar-hide px-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        onScroll={updateScrollState}
      >
        {pages.map((page, index) => (
          <PageTab
            key={page.id}
            page={page}
            index={index}
            isActive={page.id === currentPageId}
            onSelect={() => onPageSelect(page.id)}
            onRemove={onPageRemove ? () => onPageRemove(page.id) : undefined}
            allowRemove={allowRemove}
            compact={compact}
            onDragStart={onPagesReorder ? handleDragStart : undefined}
            onDragOver={onPagesReorder ? handleDragOver : undefined}
            onDragEnd={onPagesReorder ? handleDragEnd : undefined}
            isDragTarget={dragState.dropIndex === index}
          />
        ))}

        {/* Add Page Button */}
        {showAddButton && onAddPage && (
          <button
            onClick={onAddPage}
            className={`flex-shrink-0 flex items-center justify-center rounded-t-lg border-b-2 border-transparent transition-colors hover:bg-white/5 ${
              compact ? 'w-7 h-7' : 'w-8 h-8'
            }`}
          >
            <PlusIcon
              className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'}
              style={{ color: 'var(--text-muted)' }}
            />
          </button>
        )}
      </div>

      {/* Scroll Right Button */}
      {canScrollRight && (
        <button
          onClick={scrollRight}
          className="absolute right-0 z-10 p-1 rounded-l-lg transition-colors"
          style={{
            background: 'linear-gradient(to left, var(--bg-primary) 70%, transparent)',
          }}
        >
          <ChevronRightIcon className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
        </button>
      )}
    </div>
  );
}

export default PageNavigator;
