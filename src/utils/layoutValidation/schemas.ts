/**
 * Layout Validation Zod Schemas
 */

import { z } from 'zod';
import { DEFAULT_BOUNDS } from './constants';
import { toPercentage, toPercentageWithMin } from './helpers';

// ============================================================================
// BOUNDS SCHEMA
// ============================================================================

/**
 * Schema for bounds validation.
 * - Coerces string numbers to actual numbers
 * - Handles both 0-100 (percentage) and 0-1000 (normalized) scales
 * - Values > 100 are assumed to be 0-1000 and converted to percentage
 * - Provides defaults for missing values
 */
export const BoundsSchema = z
  .object({
    top: z
      .union([z.number(), z.string()])
      .transform((val) => toPercentage(val, DEFAULT_BOUNDS.top))
      .default(DEFAULT_BOUNDS.top),
    left: z
      .union([z.number(), z.string()])
      .transform((val) => toPercentage(val, DEFAULT_BOUNDS.left))
      .default(DEFAULT_BOUNDS.left),
    width: z
      .union([z.number(), z.string()])
      .transform((val) => toPercentageWithMin(val, DEFAULT_BOUNDS.width, 1))
      .default(DEFAULT_BOUNDS.width),
    height: z
      .union([z.number(), z.string()])
      .transform((val) => toPercentageWithMin(val, DEFAULT_BOUNDS.height, 1))
      .default(DEFAULT_BOUNDS.height),
  })
  .default(DEFAULT_BOUNDS);

// ============================================================================
// STYLE SCHEMA
// ============================================================================

/**
 * Schema for component style validation.
 * Allows any properties (passthrough) since AI can generate arbitrary CSS.
 */
export const StyleSchema = z
  .object({
    variant: z.string().optional(),
    hasBackground: z.boolean().optional(),
    backgroundColor: z.string().optional(),
    textColor: z.string().optional(),
    borderColor: z.string().optional(),
    borderWidth: z.string().optional(),
    isFloating: z.boolean().optional(),
    isSticky: z.boolean().optional(),
    borderRadius: z.string().optional(),
    shadow: z.string().optional(),
    padding: z.string().optional(),
    fontSize: z.string().optional(),
    fontWeight: z.string().optional(),
    textAlign: z.string().optional(),
    display: z.string().optional(),
    alignment: z.string().optional(),
    gap: z.string().optional(),
    // New fields for Zero-Preset Architecture
    textTransform: z.string().optional(),
    cursor: z.string().optional(),
    backgroundImage: z.string().optional(),
    backgroundSize: z.string().optional(),
    backgroundPosition: z.string().optional(),
    backgroundRepeat: z.string().optional(),
    lineHeight: z.string().optional(),
    letterSpacing: z.string().optional(),
    borderStyle: z.string().optional(),
    opacity: z.string().optional(),
    backdropFilter: z.string().optional(),
    transform: z.string().optional(),
    overflow: z.string().optional(),
    customCSS: z.record(z.string(), z.unknown()).optional(),
    // Animation & transition properties
    animation: z.string().optional(),
    animationKeyframes: z.record(z.string(), z.record(z.string(), z.string())).optional(),
    transition: z.string().optional(),
  })
  .passthrough()
  .default({});

// ============================================================================
// CONTENT SCHEMA
// ============================================================================

/**
 * Schema for component content validation.
 */
export const ContentSchema = z
  .object({
    text: z.string().optional(),
    hasIcon: z.boolean().optional(),
    hasImage: z.boolean().optional(),
    imageDescription: z.string().optional(),
    imageAlt: z.string().optional(),
    itemCount: z.number().optional(),
    placeholder: z.string().optional(),
    // Icon properties for exact SVG replication
    iconName: z.string().optional(),
    iconSvgPath: z.string().optional(), // Raw SVG path for exact replication
    iconViewBox: z.string().optional(), // SVG viewBox if different from default
    iconColor: z.string().optional(),
    iconPosition: z.enum(['left', 'right', 'center', 'top', 'bottom']).optional(),
    iconSize: z.enum(['sm', 'md', 'lg']).optional(),
  })
  .passthrough()
  .optional();

// ============================================================================
// LAYOUT CONFIG SCHEMA
// ============================================================================

/**
 * Schema for container layout configuration
 */
export const LayoutConfigSchema = z
  .object({
    type: z.enum(['flex', 'grid', 'absolute', 'block', 'none']),
    direction: z.enum(['row', 'column']).optional(),
    gap: z.string().optional(),
    justify: z.enum(['start', 'center', 'end', 'between', 'around', 'evenly']).optional(),
    align: z.enum(['start', 'center', 'end', 'stretch']).optional(),
    wrap: z.boolean().optional(),
    columns: z.string().optional(),
  })
  .optional();

// ============================================================================
// INTERACTIONS SCHEMA
// ============================================================================

/**
 * Schema for component interactions (hover, active, focus)
 */
export const InteractionsSchema = z
  .object({
    hover: z
      .object({
        backgroundColor: z.string().optional(),
        textColor: z.string().optional(),
        transform: z.string().optional(),
        boxShadow: z.string().optional(),
        opacity: z.number().optional(),
        borderColor: z.string().optional(),
      })
      .passthrough()
      .optional(),
    active: z
      .object({
        backgroundColor: z.string().optional(),
        textColor: z.string().optional(),
        transform: z.string().optional(),
        scale: z.number().optional(),
      })
      .passthrough()
      .optional(),
    focus: z
      .object({
        outline: z.string().optional(),
        boxShadow: z.string().optional(),
        borderColor: z.string().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough()
  .optional();

// ============================================================================
// VISUAL EFFECTS SCHEMA
// ============================================================================

/**
 * Schema for visual effects (particles, animations, etc.)
 */
export const VisualEffectsSchema = z
  .array(
    z
      .object({
        description: z.string().default(''),
        type: z.string().default('css-animation'),
        trigger: z.string().default('always'),
        cssKeyframes: z.record(z.string(), z.record(z.string(), z.string())).optional(),
        particleConfig: z
          .object({
            count: z.number().optional(),
            shape: z.string().optional(),
            colors: z.array(z.string()).optional(),
            direction: z.string().optional(),
            speed: z.string().optional(),
            size: z.object({ min: z.number().optional(), max: z.number().optional() }).optional(),
            opacity: z
              .object({ start: z.number().optional(), end: z.number().optional() })
              .optional(),
            lifetime: z.string().optional(),
          })
          .passthrough()
          .optional(),
      })
      .passthrough()
  )
  .optional();

// ============================================================================
// FULL COMPONENT SCHEMA
// ============================================================================

/**
 * Full component schema with all required fields.
 */
export const DetectedComponentSchema = z
  .object({
    id: z.string().min(1),
    type: z.string(),
    bounds: BoundsSchema,
    style: StyleSchema,
    content: ContentSchema,
    parentId: z.string().optional(),
    children: z.array(z.string()).optional(),
    role: z.string().optional(),
    layout: LayoutConfigSchema,
    zIndex: z.number().optional(),
    navigatesTo: z.string().optional(),
    isNavigationItem: z.boolean().optional(),
    isInteractive: z.boolean().optional(),
    interactions: InteractionsSchema,
    visualEffects: VisualEffectsSchema,
    confidence: z
      .union([z.number(), z.string()])
      .transform((val) => {
        const num = typeof val === 'string' ? parseFloat(val) : val;
        if (isNaN(num)) return 0.5;
        return Math.max(0, Math.min(1, num));
      })
      .default(0.5),
  })
  .passthrough();

/**
 * Schema for array of components.
 */
export const DetectedComponentArraySchema = z.array(DetectedComponentSchema);
