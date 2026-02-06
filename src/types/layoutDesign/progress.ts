/**
 * Analysis Progress Types
 * Progress tracking for design analysis phases
 */

// ============================================================================
// ANALYSIS PROGRESS TYPES
// ============================================================================

/**
 * Analysis phase status
 */
export type AnalysisPhaseStatus = 'pending' | 'active' | 'complete' | 'error';

/**
 * Sub-phase of analysis
 */
export interface AnalysisSubPhase {
  id: string;
  label: string;
  status: AnalysisPhaseStatus;
  progress: number; // 0-100
}

/**
 * Main analysis phase
 */
export interface AnalysisPhase {
  id: string;
  label: string;
  status: AnalysisPhaseStatus;
  progress: number; // 0-100
  duration?: string; // e.g., "2-3s"
  subPhases?: AnalysisSubPhase[];
  error?: string;
}

/**
 * Overall analysis progress
 */
export interface AnalysisProgress {
  phases: AnalysisPhase[];
  currentPhaseId: string | null;
  overallProgress: number; // 0-100
  startedAt: string;
  estimatedCompletion?: string;
}
