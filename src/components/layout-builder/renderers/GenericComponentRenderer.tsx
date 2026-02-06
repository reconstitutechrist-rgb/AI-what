/**
 * Generic Component Renderer
 *
 * The "Atom" of the Zero-Preset Layout Builder.
 * Renders ANY component detected by Gemini 3 Flash by mapping
 * enhanced style properties directly to CSS/Tailwind.
 *
 * Features:
 * - Arbitrary Value Support: w-[343px], h-[200px]
 * - Recursive Rendering: Renders children automatically
 * - Vision Loop Ready: Adds data-id for click-to-edit
 * - Interactive: Handles onClick for the "Seeing Canvas"
 */

import React from 'react';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VisualEffectRenderer } from '@/components/effects/VisualEffectRenderer';
import { MAX_DEPTH, DEFAULT_BOUNDS } from './types';
import type { GenericComponentRendererProps } from './types';
import { buildDynamicStyles } from './styleBuilder';
import { buildInteractionStyles, getInteractionClass } from './interactionStyles';
import { renderContent } from './contentRenderer';

export const GenericComponentRenderer: React.FC<GenericComponentRendererProps> = ({
  component,
  componentMap,
  onSelect,
  selectedId,
  depth = 0,
}) => {
  const {
    id,
    type,
    style = {},
    content,
    bounds = DEFAULT_BOUNDS,
    role,
    parentId,
    children,
  } = component;
  const isSelected = selectedId === id;
  const isContainer = role === 'container' || (children && children.length > 0);
  const isOverlay = role === 'overlay' || ['modal', 'dropdown', 'tooltip'].includes(type);

  // Determine positioning strategy
  const getPositionStrategy = (): 'absolute' | 'relative' => {
    if (isOverlay) return 'absolute';
    if (!parentId) return 'absolute';
    return 'relative';
  };
  const positionStrategy = getPositionStrategy();

  // DEBUG: Log component bounds (dev only)
  if (process.env.NODE_ENV === 'development') {
    console.log('[GenericComponentRenderer] Rendering:', id, 'type:', type, 'bounds:', bounds);
  }

  // Build styles
  const dynamicStyles = buildDynamicStyles({
    component,
    positionStrategy,
    isContainer: !!isContainer,
  });

  // Click handler for Vision Loop
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.(id);
  };

  // Selection visuals
  const selectionClass = isSelected
    ? 'ring-2 ring-blue-500 ring-offset-2'
    : 'hover:ring-1 hover:ring-blue-300 hover:ring-offset-1';

  // Recursive children rendering
  const renderChildren = () => {
    if (depth >= MAX_DEPTH) {
      console.warn(
        `[GenericComponentRenderer] Max depth (${MAX_DEPTH}) reached for component ${id}`
      );
      return null;
    }
    if (!children || children.length === 0 || !componentMap) {
      return null;
    }
    return children.map((childId) => {
      const childComponent = componentMap.get(childId);
      if (!childComponent) {
        console.warn(`[GenericComponentRenderer] Child component "${childId}" not found in map`);
        return null;
      }
      if (childComponent.visible === false) {
        return null;
      }
      return (
        <GenericComponentRenderer
          key={childId}
          component={childComponent}
          componentMap={componentMap}
          onSelect={onSelect}
          selectedId={selectedId}
          depth={depth + 1}
        />
      );
    });
  };

  // Early returns for void elements
  if (type === 'input' || type === 'search-bar') {
    return (
      <input
        data-id={id}
        placeholder={content?.placeholder || 'Enter text...'}
        style={dynamicStyles}
        className={cn('transition-all duration-200', selectionClass)}
        onClick={handleClick}
        readOnly
      />
    );
  }

  if (type === 'image-gallery') {
    return (
      <div
        data-id={id}
        style={dynamicStyles}
        className={cn('transition-all duration-200 cursor-pointer', selectionClass)}
        onClick={handleClick}
      >
        <div className="bg-gray-200 w-full h-full min-h-[100px] flex items-center justify-center text-gray-400">
          {content?.text || 'Image Gallery'}
        </div>
      </div>
    );
  }

  // Build interaction styles and classes
  const interactionStyleProps = buildInteractionStyles(component);
  const combinedStyles: React.CSSProperties = {
    ...dynamicStyles,
    ...interactionStyleProps,
  };

  const hasVisualEffects = component.visualEffects && component.visualEffects.length > 0;

  return (
    <div
      data-id={id}
      data-role={role || (isContainer ? 'container' : 'leaf')}
      data-depth={depth}
      style={combinedStyles}
      className={cn(
        !style.transition && 'transition-all duration-200',
        'cursor-pointer',
        selectionClass,
        getInteractionClass(component)
      )}
      onClick={handleClick}
    >
      {renderContent({ component, isContainer: !!isContainer })}
      {renderChildren()}
      {hasVisualEffects && (
        <VisualEffectRenderer effects={component.visualEffects!} componentId={id} />
      )}
      {component.locked && (
        <div
          className="absolute top-1 right-1 z-50 p-0.5 rounded bg-gray-800/60 text-white pointer-events-none"
          title="Locked"
        >
          <Lock size={10} />
        </div>
      )}
    </div>
  );
};
