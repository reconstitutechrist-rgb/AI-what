/**
 * DirectiveQueue — Goal queue UI component
 *
 * Reusable queue component for Dream Mode directives.
 * Used in both the Dream page and Settings.
 *
 * Features:
 *   - Text input for new directives
 *   - Drag-to-reorder via @dnd-kit
 *   - List with status badges (PENDING, IN_PROGRESS, COMPLETED, FAILED)
 *   - Visual distinction between user and discovery goals
 *   - Remove controls
 */

'use client';

import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { DreamGoal } from '@/types/dream';

interface DirectiveQueueProps {
  goals: DreamGoal[];
  onAddGoal: (prompt: string) => void;
  onRemoveGoal: (goalId: string) => void;
  onReorderGoals?: (goalIds: string[]) => void;
  disabled?: boolean;
}

const STATUS_STYLES: Record<DreamGoal['status'], { bg: string; text: string; label: string }> = {
  PENDING: { bg: 'bg-zinc-700', text: 'text-zinc-300', label: 'Pending' },
  IN_PROGRESS: { bg: 'bg-blue-900/50', text: 'text-blue-300', label: 'Running' },
  COMPLETED: { bg: 'bg-green-900/50', text: 'text-green-300', label: 'Done' },
  FAILED: { bg: 'bg-red-900/50', text: 'text-red-300', label: 'Failed' },
};

const SOURCE_BADGE: Record<DreamGoal['source'], { bg: string; text: string; label: string; icon: string }> = {
  user: { bg: 'bg-purple-900/40', text: 'text-purple-300', label: 'User', icon: '👤' },
  discovery: { bg: 'bg-amber-900/40', text: 'text-amber-300', label: 'Discovery', icon: '🔍' },
  spec: { bg: 'bg-indigo-900/40', text: 'text-indigo-300', label: 'Spec', icon: '📋' },
  temporal: { bg: 'bg-teal-900/40', text: 'text-teal-300', label: 'Temporal', icon: '⏳' },
};

// ============================================================================
// SORTABLE ITEM
// ============================================================================

function SortableGoalItem({
  goal,
  onRemoveGoal,
  disabled,
}: {
  goal: DreamGoal;
  onRemoveGoal: (goalId: string) => void;
  disabled: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: goal.id, disabled: goal.status !== 'PENDING' });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const status = STATUS_STYLES[goal.status];
  const source = SOURCE_BADGE[goal.source];

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-start gap-2 rounded-lg border border-zinc-700/50 p-3 ${status.bg}`}
    >
      {/* Drag handle (only for pending goals) */}
      {goal.status === 'PENDING' ? (
        <button
          className="mt-0.5 shrink-0 cursor-grab touch-none rounded p-0.5 text-zinc-600 hover:bg-zinc-700 hover:text-zinc-400 active:cursor-grabbing"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="9" cy="6" r="1.5" />
            <circle cx="15" cy="6" r="1.5" />
            <circle cx="9" cy="12" r="1.5" />
            <circle cx="15" cy="12" r="1.5" />
            <circle cx="9" cy="18" r="1.5" />
            <circle cx="15" cy="18" r="1.5" />
          </svg>
        </button>
      ) : (
        <div className="w-5 shrink-0" />
      )}

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className={`text-sm ${status.text}`}>
          {goal.prompt}
        </p>
        {goal.errorMessage && (
          <p className="mt-1 text-xs text-red-400">
            {goal.errorMessage}
          </p>
        )}
        <div className="mt-1.5 flex items-center gap-2">
          {/* Status badge */}
          <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${status.bg} ${status.text}`}>
            {status.label}
          </span>
          {/* Source badge */}
          <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium ${source.bg} ${source.text}`}>
            <span>{source.icon}</span>
            {source.label}
          </span>
        </div>
      </div>

      {/* Remove button (only for pending goals) */}
      {goal.status === 'PENDING' && (
        <button
          onClick={() => onRemoveGoal(goal.id)}
          disabled={disabled}
          className="shrink-0 rounded p-1 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300 disabled:opacity-50"
          title="Remove directive"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </li>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function DirectiveQueue({
  goals,
  onAddGoal,
  onRemoveGoal,
  onReorderGoals,
  disabled = false,
}: DirectiveQueueProps) {
  const [input, setInput] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    onAddGoal(trimmed);
    setInput('');
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !onReorderGoals) return;

    const oldIndex = goals.findIndex((g) => g.id === active.id);
    const newIndex = goals.findIndex((g) => g.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(goals, oldIndex, newIndex);
    onReorderGoals(reordered.map((g) => g.id));
  };

  return (
    <div className="space-y-3">
      {/* Add directive input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add a dream directive..."
          disabled={disabled}
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || !input.trim()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600"
        >
          Add
        </button>
      </form>

      {/* Goal list */}
      {goals.length === 0 ? (
        <p className="py-4 text-center text-sm text-zinc-500">
          No directives queued. Add goals above or let Discovery find them.
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={goals.map((g) => g.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="space-y-2">
              {goals.map((goal) => (
                <SortableGoalItem
                  key={goal.id}
                  goal={goal}
                  onRemoveGoal={onRemoveGoal}
                  disabled={disabled}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      {/* Summary */}
      {goals.length > 0 && (
        <div className="flex gap-4 text-xs text-zinc-500">
          <span>{goals.filter((g) => g.status === 'PENDING').length} pending</span>
          <span>{goals.filter((g) => g.status === 'COMPLETED').length} completed</span>
          <span>{goals.filter((g) => g.status === 'FAILED').length} failed</span>
        </div>
      )}
    </div>
  );
}

export default DirectiveQueue;
