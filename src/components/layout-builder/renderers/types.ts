/**
 * Shared types and constants for the GenericComponentRenderer module.
 */

import type { DetectedComponentEnhanced } from '@/types/layoutDesign';

export interface GenericComponentRendererProps {
  component: DetectedComponentEnhanced;
  /** Map of all components for recursive child lookup */
  componentMap?: Map<string, DetectedComponentEnhanced>;
  onSelect?: (id: string) => void;
  selectedId?: string | null;
  /** Nesting depth for debugging and recursion limits */
  depth?: number;
}

/** Maximum nesting depth to prevent infinite recursion */
export const MAX_DEPTH = 10;

/** Default bounds for components with missing/invalid bounds data */
export const DEFAULT_BOUNDS = { top: 0, left: 0, width: 20, height: 10 };
