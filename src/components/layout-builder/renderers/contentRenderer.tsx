/**
 * Content rendering logic for GenericComponentRenderer.
 * Handles icon+text combos, standalone icons, text, images, and fallback labels.
 */

import React from 'react';
import type { DetectedComponentEnhanced } from '@/types/layoutDesign';
import { renderIcon } from './iconRenderer';

interface ContentRendererProps {
  component: DetectedComponentEnhanced;
  isContainer: boolean;
}

/** Render the content of a component based on its type and content data */
export function renderContent({ component, isContainer }: ContentRendererProps): React.ReactNode {
  const { type, style = {}, content, bounds, children } = component;

  // If this is a container with children, don't show placeholder content
  if (isContainer && children && children.length > 0) {
    return null;
  }

  const hasIconContent = content?.hasIcon && (content?.iconSvgPath || content?.iconName);
  const hasTextContent = content?.text;
  const hasImageContent = content?.hasImage;

  // Render icon + text combination
  if (hasIconContent && hasTextContent) {
    const iconPosition = content?.iconPosition || 'left';

    const getFlexClass = () => {
      switch (iconPosition) {
        case 'top':
          return 'flex-col';
        case 'bottom':
          return 'flex-col-reverse';
        case 'right':
          return 'flex-row-reverse';
        case 'left':
        default:
          return 'flex-row';
      }
    };

    const isVertical = iconPosition === 'top' || iconPosition === 'bottom';
    const alignClass = isVertical ? 'items-center text-center' : 'items-center';

    return (
      <div className={`flex ${getFlexClass()} ${alignClass}`} style={{ gap: style.gap || '8px' }}>
        {renderIcon({ content: content!, textColor: style.textColor })}
        <span
          style={{ flex: '1 1 auto', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          {content!.text}
        </span>
      </div>
    );
  }

  // Render standalone icon
  if (hasIconContent) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        {renderIcon({ content: content!, textColor: style.textColor })}
      </div>
    );
  }

  // Render text only
  if (hasTextContent) {
    return content!.text;
  }

  // Render image content
  if (hasImageContent) {
    if (style.backgroundImage) {
      return null;
    }

    if (content!.imageDescription) {
      return (
        <div
          className="w-full h-full flex flex-col items-center justify-center gap-2 overflow-hidden"
          style={{
            backgroundColor: style.backgroundColor || 'rgba(229, 231, 235, 0.3)',
            minHeight: bounds?.height ? undefined : '60px',
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-gray-400 flex-shrink-0"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <span
            className="text-gray-500 text-xs text-center px-2 leading-tight"
            style={{ maxWidth: '90%' }}
          >
            {content!.imageDescription}
          </span>
          {content!.imageAlt && (
            <span className="text-gray-400 text-xs italic truncate" style={{ maxWidth: '90%' }}>
              {content!.imageAlt}
            </span>
          )}
        </div>
      );
    }

    // Fallback: minimal placeholder
    return (
      <div
        className="w-full h-full flex items-center justify-center text-gray-400 text-xs"
        style={{
          backgroundColor: style.backgroundColor || 'rgba(229, 231, 235, 0.5)',
          minHeight: bounds?.height ? undefined : '40px',
        }}
      >
        [IMG]
      </div>
    );
  }

  // Fallback: show component type label
  return (
    <div className="w-full h-full flex items-center justify-center">
      <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded border border-gray-300 select-none">
        {type.replace(/-/g, ' ').toUpperCase()}
      </span>
    </div>
  );
}
