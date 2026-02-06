/**
 * Icon rendering logic for GenericComponentRenderer.
 * Supports both raw SVG paths (exact replicas) and named icons (fallback).
 */

import React from 'react';
import type { DetectedComponentEnhanced } from '@/types/layoutDesign';
import { getIconPath } from './iconPaths';

interface IconRendererProps {
  content: NonNullable<DetectedComponentEnhanced['content']>;
  textColor?: string;
}

/** Get icon dimensions, supporting arbitrary px sizes and preset names */
function getIconSize(size?: string): { width: string; height: string } {
  const s = size || 'md';
  if (typeof s === 'string' && s.endsWith('px')) {
    return { width: s, height: s };
  }
  const presets: Record<string, string> = { sm: '16px', md: '20px', lg: '28px' };
  const pxSize = presets[s] || presets.md;
  return { width: pxSize, height: pxSize };
}

/** Render an icon element (SVG) */
export function renderIcon({ content, textColor }: IconRendererProps): React.ReactElement | null {
  if (!content?.hasIcon) return null;
  if (!content?.iconSvgPath && !content?.iconName) return null;

  const iconSize = getIconSize(content.iconSize);
  const iconColor = content.iconColor || textColor || 'currentColor';
  const pathData = content.iconSvgPath || getIconPath(content.iconName || 'Info');
  const viewBox = content.iconViewBox || '0 0 24 24';

  const iconElement = (
    <span
      className="inline-flex items-center justify-center flex-shrink-0"
      style={{ color: iconColor, width: iconSize.width, height: iconSize.height }}
      title={content.iconName}
    >
      <svg
        className="w-full h-full"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        viewBox={viewBox}
      >
        <path d={pathData} />
      </svg>
    </span>
  );

  // Wrap in container if iconContainerStyle is specified
  if (content.iconContainerStyle) {
    const getContainerSize = (): string => {
      const size = content.iconContainerStyle?.size || 'md';
      if (typeof size === 'string' && size.endsWith('px')) return size;
      const presets: Record<string, string> = { sm: '32px', md: '48px', lg: '64px' };
      return presets[size] || '48px';
    };
    const containerSize = getContainerSize();

    const borderRadiusMap: Record<string, string> = {
      circle: '50%',
      square: '0',
      rounded: '8px',
    };

    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: containerSize,
          height: containerSize,
          borderRadius: borderRadiusMap[content.iconContainerStyle.shape],
          backgroundColor: content.iconContainerStyle.backgroundColor || 'transparent',
          border: content.iconContainerStyle.borderWidth
            ? `${content.iconContainerStyle.borderWidth} solid ${content.iconContainerStyle.borderColor || 'currentColor'}`
            : undefined,
          padding: content.iconContainerStyle.padding,
          flexShrink: 0,
        }}
      >
        {iconElement}
      </div>
    );
  }

  return iconElement;
}
