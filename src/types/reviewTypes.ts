/**
 * Type definitions for Review Page and PLAN Mode Concept Updates
 *
 * Used by:
 * - Review page (read-only confirmation before Builder)
 * - PLAN mode concept update flow in Builder
 */

import type { AppConcept } from './appConcept';
import type { DynamicPhasePlan } from './dynamicPhases';

// ============================================================================
// BUILD SETTINGS
// ============================================================================

/**
 * User-configurable build settings from Review page
 * Persisted to store and used by Builder
 */
export interface BuildSettings {
  /** Whether to automatically advance to next phase after completion */
  autoAdvance: boolean;
}

// ============================================================================
// LAYOUT THUMBNAIL
// ============================================================================

/**
 * Captured layout preview thumbnail from Design page
 * Displayed in Review page for visual confirmation
 */
export interface LayoutThumbnail {
  /** Base64 data URL of the captured image */
  dataUrl: string;
  /** ISO timestamp when the thumbnail was captured */
  capturedAt: string;
}

// ============================================================================
// PLAN MODE CONCEPT UPDATES
// ============================================================================

/**
 * Request to update concept via PLAN mode chat
 */
export interface ConceptUpdateRequest {
  /** Type of concept modification */
  type: 'add_feature' | 'modify_feature' | 'change_description' | 'full_update';
  /** Partial changes to apply to AppConcept */
  changes: Partial<AppConcept>;
  /** Whether to regenerate phases after update */
  regeneratePhases: boolean;
}

/**
 * Individual change detected in concept diff
 * Used for confirmation dialog display
 */
export interface ConceptChange {
  /** Field or feature name that changed */
  field: string;
  /** Type of change */
  type: 'added' | 'removed' | 'modified';
  /** Previous value (for modified/removed) */
  oldValue?: unknown;
  /** New value (for modified/added) */
  newValue?: unknown;
}

/**
 * API response for concept update request
 */
export interface ConceptUpdateResponse {
  /** Whether the update succeeded */
  success: boolean;
  /** Updated concept (on success) */
  updatedConcept?: AppConcept;
  /** List of changes for confirmation display */
  changes?: ConceptChange[];
  /** New phase plan if regenerated */
  phasePlan?: DynamicPhasePlan;
  /** ISO timestamp when phases were regenerated */
  regeneratedAt?: string;
  /** Error message (on failure) */
  error?: string;
  /** Original concept for verification on error */
  originalConcept?: AppConcept;
}

// ============================================================================
// PENDING CONCEPT UPDATE STATE
// ============================================================================

/**
 * State for pending concept update awaiting user confirmation
 * Used by MainBuilderView to show confirmation dialog
 */
export interface PendingConceptUpdate {
  /** Changes detected for display */
  changes: ConceptChange[];
  /** Updated concept to apply on confirm */
  updatedConcept: AppConcept;
  /** New phase plan (if regenerated) */
  phasePlan: DynamicPhasePlan | null;
}
