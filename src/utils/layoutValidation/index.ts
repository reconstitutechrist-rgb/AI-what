/**
 * Layout Validation Barrel Export
 *
 * Re-exports all public functions, constants, and types from the layoutValidation module.
 * Maintains backward compatibility with existing imports.
 */

// Constants
export { DEFAULT_BOUNDS, KNOWN_COMPONENT_TYPES, KNOWN_ROLES, CONTAINER_TYPES } from './constants';

// Helper functions
export { toPercentage, toPercentageWithMin, safeNumber, sanitizeBounds } from './helpers';

// Zod schemas
export {
  BoundsSchema,
  StyleSchema,
  ContentSchema,
  LayoutConfigSchema,
  InteractionsSchema,
  VisualEffectsSchema,
  DetectedComponentSchema,
  DetectedComponentArraySchema,
} from './schemas';

// Sanitization functions and types
export type { SanitizationResult } from './sanitization';
export {
  sanitizeComponent,
  sanitizeComponents,
  validateComponentsForRender,
} from './sanitization';

// Hierarchy and inference functions and types
export type { HierarchyValidationResult, ComponentTreeResult } from './inference';
export {
  validateHierarchy,
  buildComponentTree,
  repairOrphans,
  inferContainerLayouts,
  migrateToHierarchical,
} from './inference';

// Overlap resolution functions
export { resolveRootOverlaps, detectOverlaps } from './overlaps';
