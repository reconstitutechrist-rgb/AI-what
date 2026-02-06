/**
 * API Request and Response Types
 * Chat request/response structures and quick analysis types
 */

import type { LayoutMessage } from './messages';
import type { LayoutDesign } from './layoutDesignType';
import type { SelectedElementInfo } from './structure';
import type { PageReference, MultiPageDesign } from './multiPage';
import type { DetectedAnimation } from './video';
import type { CompleteDesignAnalysis } from './analysis';
import type { DesignContext } from './conversation';

// ============================================================================
// API Types
// ============================================================================

/** Workflow state for multi-step design workflows */
export interface LayoutWorkflowState {
  workflowId: string;
  workflowType: string;
  currentStepIndex: number;
  completedSteps: string[];
  skippedSteps: string[];
  stepNotes: Record<string, string>;
  startedAt: string;
}

/** Device view types for responsive design */
export type DeviceView = 'desktop' | 'tablet' | 'mobile';

export interface LayoutChatRequest {
  message: string;
  conversationHistory: LayoutMessage[];
  /** Current design state - optional if designUnchanged is true (token optimization) */
  currentDesign?: Partial<LayoutDesign>;
  /** Signal that design hasn't changed since last request (token optimization) */
  designUnchanged?: boolean;
  /** Selected element info for scoped AI changes (Click + Talk mode) */
  selectedElement?: SelectedElementInfo;
  previewScreenshot?: string;
  referenceImages?: string[];
  /** Analysis mode: standard, pixel-perfect replication, or video-replication */
  analysisMode?: 'standard' | 'pixel-perfect' | 'video-replication';
  /** Type of analysis to perform */
  requestedAnalysis?: 'quick' | 'deep' | 'full';
  /** Cross-session memories context from semantic memory (P0-P1 Phase 7b) */
  memoriesContext?: string;
  /** Current workflow state for multi-step design workflows */
  workflowState?: LayoutWorkflowState;
  /** Current device view for responsive context */
  currentDevice?: DeviceView;

  // Multi-page mode fields
  /** Page references for multi-page analysis */
  pageReferences?: PageReference[];
  /** Current page ID being edited */
  currentPageId?: string;
  /** Request type for routing */
  requestType?: 'single-page' | 'multi-page-analysis' | 'page-specific' | 'add-pages';
  /** Existing multi-page design for incremental updates */
  existingMultiPageDesign?: MultiPageDesign;
}

export interface DesignChange {
  property: string;
  oldValue: unknown;
  newValue: unknown;
  reason: string;
}

export interface SuggestedAction {
  label: string;
  action: string;
  icon?: string;
}

export interface LayoutChatResponse {
  message: string;
  updatedDesign: Partial<LayoutDesign>;
  suggestedActions?: SuggestedAction[];
  designChanges?: DesignChange[];
  /** Detected design pattern from user message (e.g., "glassmorphism", "minimal") */
  detectedPattern?: {
    id: string;
    name: string;
    description: string;
  };
  tokensUsed: { input: number; output: number };
  /** Complete pixel-perfect analysis results (if pixel-perfect mode) */
  pixelPerfectAnalysis?: CompleteDesignAnalysis;
  /** Quick analysis results for fast feedback */
  quickAnalysis?: QuickAnalysis;
  /** Extracted context from user message (purpose, target users, requirements) */
  extractedContext?: DesignContext;
  /** Animations created via apply_animation tool */
  animations?: DetectedAnimation[];
  /** Background images generated via generate_background tool (DALL-E) */
  generatedBackgrounds?: Array<{
    url: string;
    targetElement: string;
    prompt: string;
  }>;
  /** List of tools that were used in this response */
  toolsUsed?: string[];
  /** Updated workflow state after processing (for multi-step workflows) */
  workflowState?: LayoutWorkflowState;
}

// ============================================================================
// ENHANCED API TYPES
// ============================================================================

/**
 * Analysis mode for layout chat
 */
export type AnalysisMode = 'standard' | 'pixel-perfect' | 'video-replication';

/**
 * Enhanced layout chat request with analysis modes
 */
export interface EnhancedLayoutChatRequest extends LayoutChatRequest {
  analysisMode?: AnalysisMode;
  requestedAnalysis?: 'quick' | 'deep' | 'full';
  videoAnalysis?: import('./video').VideoAnalysisResult;
  extractedSpecs?: CompleteDesignAnalysis;
}

/**
 * Quick analysis result (fast pass)
 */
export interface QuickAnalysis {
  dominantColors: import('./analysis').ColorSwatch[];
  layoutType: string;
  primaryFont: string;
  overallStyle: string;
  confidence: number;
}

/**
 * Deep analysis result (full pass)
 */
export interface DeepAnalysis extends CompleteDesignAnalysis {
  quickAnalysis: QuickAnalysis;
}

/**
 * Spec sheet export formats
 */
export interface SpecSheetExport {
  json: string;
  css: string;
  tailwindConfig: string;
}
