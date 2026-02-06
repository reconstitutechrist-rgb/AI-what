/**
 * Dynamic style builder for GenericComponentRenderer.
 * Computes the full React.CSSProperties object from a DetectedComponentEnhanced.
 */

import type React from 'react';
import type { DetectedComponentEnhanced } from '@/types/layoutDesign';
import { calculateMinHeightForText } from '@/utils/responsiveTypography';
import {
  ensureUnit,
  getDefaultZIndex,
  isFullViewportContainer,
  getContainerLayoutStyles,
} from './styleUtils';

interface BuildStylesParams {
  component: DetectedComponentEnhanced;
  positionStrategy: 'absolute' | 'relative';
  isContainer: boolean;
}

/** Build the complete dynamic styles for a component */
export function buildDynamicStyles({
  component,
  positionStrategy,
  isContainer,
}: BuildStylesParams): React.CSSProperties {
  const {
    id,
    type,
    style = {},
    content,
    bounds = { top: 0, left: 0, width: 20, height: 10 },
    layout,
    parentId,
  } = component;

  const dynamicStyles: React.CSSProperties = {
    position: positionStrategy,

    // Absolute positioning for roots and overlays
    ...(positionStrategy === 'absolute'
      ? {
          top: `${bounds?.top ?? 0}%`,
          left: `${bounds?.left ?? 0}%`,
          width: bounds?.width ? `${bounds.width}%` : 'auto',
          height: bounds?.height ? `${bounds.height}%` : 'auto',
        }
      : {
          flex: bounds?.width ? `0 1 ${bounds.width}%` : '1 1 auto',
          maxWidth: bounds?.width ? `${bounds.width}%` : undefined,
          height: bounds?.height ? `${bounds.height}%` : 'auto',
        }),

    // Content-aware minHeight for text components
    minHeight: (() => {
      if (!content?.text || !bounds?.width) return undefined;
      const minHeightPx = calculateMinHeightForText(
        content.text,
        style.fontSize,
        style.lineHeight,
        bounds.width
      );
      const currentHeightPx = bounds.height ? (bounds.height / 100) * 800 : 0;
      return minHeightPx > currentHeightPx ? `${minHeightPx}px` : undefined;
    })(),

    // Visuals
    color: style.textColor,
    borderRadius: style.borderRadius,
    padding: style.padding,
    fontSize: ensureUnit(style.fontSize),
    fontWeight: style.fontWeight as React.CSSProperties['fontWeight'],
    textAlign: style.textAlign as React.CSSProperties['textAlign'],
    textTransform: style.textTransform as React.CSSProperties['textTransform'],
    letterSpacing: ensureUnit(style.letterSpacing),
    lineHeight: style.lineHeight,
    boxShadow: style.shadow,

    // Typography extensions
    fontFamily: style.fontFamily,
    fontStyle: style.fontStyle as React.CSSProperties['fontStyle'],
    textDecoration: style.textDecoration,
    textShadow: style.textShadow,

    // Background properties
    backgroundImage: style.backgroundImage,
    backgroundSize: style.backgroundSize,
    backgroundPosition: style.backgroundPosition,
    backgroundRepeat: style.backgroundRepeat,

    // Visual effects
    opacity: style.opacity,
    backdropFilter: style.backdropFilter,
    transform: style.transform,
    filter: style.filter,
    mixBlendMode: style.mixBlendMode as React.CSSProperties['mixBlendMode'],

    // Animation & transitions
    animation: (() => {
      if (!style.animation && component.motionConfig) {
        const parts: string[] = [];
        if (component.motionConfig.entrance && component.motionConfig.entrance.type !== 'none') {
          const e = component.motionConfig.entrance;
          const name = `${id}--entrance-${e.type}-${e.direction || 'default'}`;
          parts.push(
            `${name} ${e.duration || 500}ms ${e.easing || 'ease-out'} ${e.delay || 0}ms both`
          );
        }
        if (component.motionConfig.loop) {
          const l = component.motionConfig.loop;
          const name = `${id}--loop-${l.type}-${id}`;
          parts.push(`${name} ${l.duration || 3000}ms ease-in-out infinite`);
        }
        return parts.length > 0 ? parts.join(', ') : undefined;
      }
      if (!style.animation) return undefined;
      if (!style.animationKeyframes) return style.animation;
      const timePattern = /^[\d.]+m?s$/;
      const keywords = new Set([
        'ease',
        'ease-in',
        'ease-out',
        'ease-in-out',
        'linear',
        'step-start',
        'step-end',
        'normal',
        'reverse',
        'alternate',
        'alternate-reverse',
        'none',
        'forwards',
        'backwards',
        'both',
        'running',
        'paused',
        'infinite',
      ]);
      const namespaceAnimation = (anim: string): string => {
        const tokens = anim.trim().split(/\s+/);
        return tokens
          .map((token) => {
            const lower = token.toLowerCase();
            if (timePattern.test(lower)) return token;
            if (keywords.has(lower)) return token;
            if (lower.startsWith('cubic-bezier') || lower.startsWith('steps')) return token;
            if (/^\d+$/.test(lower)) return token;
            return `${id}--${token}`;
          })
          .join(' ');
      };
      return style.animation.split(',').map(namespaceAnimation).join(',');
    })(),
    transition: style.transition,

    // Cursor
    cursor: style.cursor,

    // Border style
    borderStyle: style.borderStyle as React.CSSProperties['borderStyle'],

    // Overflow control
    overflow: (() => {
      if (style.overflow) return style.overflow;
      if (!parentId && isContainer) return 'visible' as const;
      const typeStr = type as string;
      const isTextComponent =
        content?.text ||
        typeStr.includes('text') ||
        typeStr.includes('heading') ||
        typeStr.includes('paragraph') ||
        typeStr.includes('label') ||
        typeStr === 'button' ||
        typeStr === 'link' ||
        typeStr === 'badge';
      if (isTextComponent) return 'hidden' as const;
      return isContainer ? ('visible' as const) : ('hidden' as const);
    })(),

    // Spacing and sizing
    margin: style.margin,
    maxWidth: style.maxWidth,
    maxHeight: style.maxHeight,
    aspectRatio: style.aspectRatio,

    // Image handling
    objectFit: style.objectFit as React.CSSProperties['objectFit'],
    objectPosition: style.objectPosition,

    // Text handling
    whiteSpace: style.whiteSpace as React.CSSProperties['whiteSpace'],
    textOverflow: style.textOverflow as React.CSSProperties['textOverflow'],
    wordBreak: style.wordBreak as React.CSSProperties['wordBreak'],

    // Flex control
    flexGrow: style.flexGrow,
    flexShrink: style.flexShrink,
    order: style.order,

    // Container layout (flex/grid) or leaf node layout
    ...(isContainer
      ? getContainerLayoutStyles(layout)
      : {
          display: style.display || 'flex',
          flexDirection: (type === 'list' || type === 'content-section'
            ? 'column'
            : 'row') as React.CSSProperties['flexDirection'],
          alignItems: style.alignment === 'center' ? 'center' : 'flex-start',
          justifyContent:
            style.alignment === 'center'
              ? 'center'
              : style.alignment === 'between'
                ? 'space-between'
                : 'flex-start',
          gap: style.gap,
        }),

    // Background color
    backgroundColor: (() => {
      const bgColor = (style.customCSS?.backgroundColor as string) || style.backgroundColor;
      if (bgColor === undefined || bgColor === null || bgColor === '') {
        return 'transparent';
      }
      return bgColor;
    })(),

    // Border
    border:
      style.borderWidth || style.borderColor
        ? `${style.borderWidth || '1px'} ${style.borderStyle || 'solid'} ${style.borderColor || 'currentColor'}`
        : undefined,

    // Z-index
    zIndex: component.zIndex ?? getDefaultZIndex(type),

    // Pointer events for full-viewport containers
    pointerEvents: isFullViewportContainer(type, bounds) ? 'none' : 'auto',

    // Debug outline
    outline: process.env.NODE_ENV === 'development' ? '1px dashed rgba(255, 0, 0, 0.3)' : undefined,

    // customCSS overrides everything
    ...style.customCSS,
  };

  return dynamicStyles;
}
