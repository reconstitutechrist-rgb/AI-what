/**
 * Project Management Types
 *
 * Defines the shape of a saved project snapshot stored in IndexedDB.
 * A SavedProject captures the complete state of a project so it can
 * be restored exactly as the user left it.
 */

import type { AppConcept } from './appConcept';
import type { GeneratedComponent } from './aiBuilderTypes';
import type { LayoutManifest } from './schema';
import type { DesignSpec } from './designSpec';
import type { DynamicPhasePlan } from './dynamicPhases';
import type { BuildSettings, LayoutThumbnail } from './reviewTypes';
import type { AppFile } from './railway';
import type { ChatMessage as OmniChatMessage } from '@/store/useChatStore';

// ============================================================================
// SAVED PROJECT (full snapshot stored in IndexedDB)
// ============================================================================

export interface SavedProject {
  /** Unique identifier (UUID) */
  id: string;
  /** User-facing project name */
  name: string;
  /** Brief description (from appConcept or user input) */
  description: string;
  /** ISO timestamp of creation */
  createdAt: string;
  /** ISO timestamp of last save */
  updatedAt: string;
  /** Current build lifecycle stage */
  buildStatus: 'planning' | 'designing' | 'building' | 'complete';

  // --- Core data snapshots (from useAppStore) ---
  appConcept: AppConcept | null;
  generatedFiles: AppFile[];
  currentLayoutManifest: LayoutManifest | null;
  currentDesignSpec: DesignSpec | null;
  currentComponent: GeneratedComponent | null;
  isReviewed: boolean;
  buildSettings: BuildSettings;
  layoutThumbnail: LayoutThumbnail | null;
  dynamicPhasePlan: DynamicPhasePlan | null;
  phasePlanGeneratedAt: string | null;

  // --- Chat history (from useChatStore, scoped to this project) ---
  chatMessages: OmniChatMessage[];
}

// ============================================================================
// PROJECT LIST ITEM (lightweight, for rendering project cards)
// ============================================================================

export interface ProjectListItem {
  id: string;
  name: string;
  description: string;
  updatedAt: string;
  buildStatus: SavedProject['buildStatus'];
  thumbnailUrl: string | null;
}
