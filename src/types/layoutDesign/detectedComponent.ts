/**
 * Detected Component Types
 * Enhanced component detection with precise positioning for exact replication
 */

import type { VisualEffect } from './interactions';

/**
 * Enhanced component detection with precise positioning for exact replication
 */
export interface DetectedComponentEnhanced {
  /** Unique identifier for this component instance */
  id: string;
  /** Component type (string to allow novel types from AI detection) */
  type: string;
  /** Precise bounding box as percentage of viewport (0-100) */
  bounds: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  /** Style details - enhanced with more properties from AI analysis */
  style: {
    variant?: string;
    hasBackground?: boolean;
    backgroundColor?: string;
    textColor?: string;
    borderColor?: string;
    borderWidth?: string;
    isFloating?: boolean;
    isSticky?: boolean;
    borderRadius?: string;
    shadow?: string;
    padding?: string;
    fontSize?: string;
    fontWeight?: string;
    textAlign?: string;
    display?: string;
    alignment?: string;
    gap?: string;
    /** Text transformation */
    textTransform?: 'uppercase' | 'lowercase' | 'capitalize' | 'none';
    /** Cursor style */
    cursor?: string;
    /** Background properties */
    backgroundImage?: string;
    backgroundSize?: string;
    backgroundPosition?: string;
    backgroundRepeat?: string;
    /** Typography details */
    lineHeight?: string;
    letterSpacing?: string;
    /** Per-component font family override */
    fontFamily?: string;
    /** Font style (italic, normal) */
    fontStyle?: 'normal' | 'italic' | 'oblique';
    /** Text decoration */
    textDecoration?: 'none' | 'underline' | 'line-through' | 'overline' | string;
    /** Text shadow for glow effects */
    textShadow?: string;
    /** Border details */
    borderStyle?: 'solid' | 'dashed' | 'dotted' | 'none' | string;
    /** Visual effects */
    opacity?: string;
    backdropFilter?: string;
    transform?: string;
    /** Filter effects (blur, grayscale, etc.) */
    filter?: string;
    /** Blend mode */
    mixBlendMode?: string;
    /** Spacing */
    margin?: string;
    /** Max width constraint */
    maxWidth?: string;
    /** Max height constraint */
    maxHeight?: string;
    /** Min height specific value */
    minHeight?: string;
    /** Aspect ratio */
    aspectRatio?: string;
    /** Layout control */
    overflow?: 'visible' | 'hidden' | 'scroll' | 'auto' | string;
    /** Image object fit */
    objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
    /** Image object position */
    objectPosition?: string;
    /** White space handling */
    whiteSpace?: 'normal' | 'nowrap' | 'pre' | 'pre-wrap' | 'pre-line';
    /** Text overflow */
    textOverflow?: 'clip' | 'ellipsis';
    /** Word break */
    wordBreak?: 'normal' | 'break-all' | 'keep-all' | 'break-word';
    /** Flex properties for advanced layouts */
    flexGrow?: number;
    flexShrink?: number;
    order?: number;
    /** Position for sticky/fixed elements */
    position?: 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky';
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
    /** CSS animation shorthand (e.g., 'gradient-shift 3s ease infinite') */
    animation?: string;
    /** Inline @keyframes definition — renderer injects as <style> tag */
    animationKeyframes?: Record<string, Record<string, string>>;
    /** CSS transition shorthand (e.g., 'all 0.3s ease') */
    transition?: string;
    /** Arbitrary CSS properties for "Zero-Preset" custom designs (e.g., gradients, filters, complex shadows) */
    customCSS?: Record<string, string | number>;
  };
  /** Content information extracted from the component */
  content?: {
    text?: string;
    hasIcon?: boolean;
    hasImage?: boolean;
    /** Detailed description of the image for AI generation (e.g., 'Company logo: blue shield with white lightning bolt') */
    imageDescription?: string;
    /** Alt text for accessibility */
    imageAlt?: string;
    itemCount?: number;
    placeholder?: string;
    /** Lucide icon name (e.g. "Home", "User", "Menu") - FALLBACK when SVG path not available */
    iconName?: string;
    /** Raw SVG path d attribute for exact icon replication - PREFERRED over iconName */
    iconSvgPath?: string;
    /** SVG viewBox if different from default "0 0 24 24" */
    iconViewBox?: string;
    /** Icon color hex code */
    iconColor?: string;
    /** Icon position relative to text */
    iconPosition?: 'left' | 'right' | 'center' | 'top' | 'bottom';
    /** Icon size */
    iconSize?: 'sm' | 'md' | 'lg';
    /** Container style for icons (circular background, etc.) */
    iconContainerStyle?: {
      shape: 'circle' | 'square' | 'rounded';
      backgroundColor?: string;
      borderColor?: string;
      borderWidth?: string;
      size?: 'sm' | 'md' | 'lg';
      padding?: string;
    };
  };
  /** Parent component ID for hierarchy */
  parentId?: string;
  /** Child component IDs */
  children?: string[];
  /** Component role for positioning strategy */
  role?: string;
  /** Container layout configuration (for role: 'container') */
  layout?: {
    /** Layout type */
    type: 'flex' | 'grid' | 'absolute' | 'block' | 'none';
    /** Flex direction */
    direction?: 'row' | 'column';
    /** Gap between children */
    gap?: string;
    /** Justify content */
    justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
    /** Align items */
    align?: 'start' | 'center' | 'end' | 'stretch';
    /** Flex wrap */
    wrap?: boolean;
    /** Grid columns (e.g., "repeat(3, 1fr)") */
    columns?: string;
  };
  /** Z-index layer */
  zIndex?: number;
  /** If this is a navigation item, which page does it link to */
  navigatesTo?: string;
  /** Is this element part of the navigation system */
  isNavigationItem?: boolean;
  /** Is this element interactive (button, link, input) */
  isInteractive?: boolean;
  /** Interactive state styles (hover, active, focus) for buttons/links */
  interactions?: {
    hover?: {
      backgroundColor?: string;
      textColor?: string;
      transform?: string;
      boxShadow?: string;
      opacity?: number;
      borderColor?: string;
    };
    active?: {
      backgroundColor?: string;
      textColor?: string;
      transform?: string;
      scale?: number;
    };
    focus?: {
      outline?: string;
      boxShadow?: string;
      borderColor?: string;
    };
  };
  /** Non-CSS visual effects (particles, canvas animations, complex motion) */
  visualEffects?: VisualEffect[];

  // --- Multi-Source & Manipulation Fields ---

  /** Source tracking: which uploaded media file produced this component (Gap 1) */
  sourceId?: string;
  /** Video-derived motion configuration (Gap 2) */
  motionConfig?: import('@/types/motionConfig').ComponentMotionConfig;
  /** Prevent accidental drag/resize in direct manipulation mode (Gap 3) */
  locked?: boolean;
  /** Group membership ID for component grouping (Gap 4) */
  groupId?: string;
  /** Toggle visibility in the component tree panel (Gap 4). Default: true */
  visible?: boolean;
  /** User-editable display name for the component tree (Gap 4) */
  displayName?: string;

  /** Confidence score 0-1 */
  confidence: number;
}

/**
 * Visual effect configuration for non-CSS effects (particles, canvas, complex motion)
 * Detected by Stage 2 "The Engineer" and rendered by VisualEffectRenderer
 */
export type { VisualEffect } from './interactions';
