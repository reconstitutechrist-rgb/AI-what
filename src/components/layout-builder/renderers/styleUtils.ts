/**
 * Style utility functions for the GenericComponentRenderer.
 * Pure functions with no React dependency.
 */

import type React from 'react';
import type { DetectedComponentEnhanced } from '@/types/layoutDesign';

/**
 * Ensures a value has a CSS unit. If the value is a plain number or numeric string,
 * adds the default unit. Otherwise returns the value as-is.
 * This prevents silent CSS failures when AI returns "16" instead of "16px".
 */
export const ensureUnit = (
  value: string | number | undefined,
  defaultUnit: string = 'px'
): string | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  const str = String(value);
  // If it's a pure number (no unit), add the default unit
  if (/^-?\d+(\.\d+)?$/.test(str)) {
    return `${str}${defaultUnit}`;
  }
  // Already has a unit or is a special value (like "normal", "inherit")
  return str;
};

/** Smart z-index based on component type */
export const getDefaultZIndex = (componentType: DetectedComponentEnhanced['type']): number => {
  const zIndexMap: Record<string, number> = {
    modal: 1000,
    header: 100,
    navigation: 90,
    sidebar: 80,
    footer: 50,
    hero: 20,
    'main-canvas': 1,
    container: 1,
  };
  return zIndexMap[componentType] || 10;
};

/** Check if component is a full-viewport container */
export const isFullViewportContainer = (
  type: string,
  bounds: { top: number; left: number; width: number; height: number }
): boolean => {
  const containerTypes = ['main-canvas', 'container', 'content-section'];
  return (
    containerTypes.includes(type) &&
    bounds?.top === 0 &&
    bounds?.left === 0 &&
    bounds?.width >= 99 &&
    bounds?.height >= 99
  );
};

/** Map justify values to CSS */
export const mapJustify = (justify?: string): string => {
  const map: Record<string, string> = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    between: 'space-between',
    around: 'space-around',
    evenly: 'space-evenly',
  };
  return map[justify || 'start'] || 'flex-start';
};

/** Map align values to CSS */
export const mapAlign = (align?: string): string => {
  const map: Record<string, string> = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    stretch: 'stretch',
  };
  return map[align || 'stretch'] || 'stretch';
};

/** Get container layout styles (flex/grid) */
export const getContainerLayoutStyles = (
  layout: DetectedComponentEnhanced['layout']
): React.CSSProperties => {
  const layoutType = layout?.type || 'flex';

  if (layoutType === 'none') {
    return {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '0px',
    };
  }

  if (layoutType === 'flex') {
    return {
      display: 'flex',
      flexDirection: (layout?.direction || 'column') as React.CSSProperties['flexDirection'],
      gap: layout?.gap || '0',
      justifyContent: mapJustify(layout?.justify),
      alignItems: mapAlign(layout?.align),
      flexWrap: layout?.wrap ? 'wrap' : 'nowrap',
    };
  }

  if (layoutType === 'grid') {
    return {
      display: 'grid',
      gridTemplateColumns: layout?.columns || 'repeat(auto-fit, minmax(100px, 1fr))',
      gap: layout?.gap || '0',
      justifyItems: mapAlign(layout?.justify),
      alignItems: mapAlign(layout?.align),
    };
  }

  return {};
};
