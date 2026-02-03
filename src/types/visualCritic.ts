/**
 * Visual Critic Types
 *
 * Type definitions for the AI-powered visual quality assessment system.
 * The Visual Critic captures screenshots of rendered code and sends them
 * to a vision model for quality evaluation against the original request.
 */

// ============================================================================
// CRITIQUE RESULT
// ============================================================================

/** Full result from a visual critique evaluation */
export interface CritiqueResult {
  /** Overall quality score (1-10) */
  overallScore: number;
  /** Whether the output meets quality threshold */
  verdict: CritiqueVerdict;
  /** Specific issues found in the rendered output */
  issues: VisualIssue[];
  /** Suggestions for improvement */
  suggestions: string[];
  /** The screenshot that was evaluated (base64 data URI) */
  screenshotDataUri?: string;
  /** How long the critique took (ms) */
  duration: number;
}

/** Verdict from the visual critic */
export type CritiqueVerdict = 'accept' | 'needs_improvement' | 'regenerate';

/** A specific visual issue identified by the critic */
export interface VisualIssue {
  /** Category of the issue */
  category: 'layout' | 'styling' | 'content' | 'responsiveness' | 'completeness' | 'accessibility';
  /** Severity level */
  severity: 'minor' | 'moderate' | 'major';
  /** Human-readable description */
  description: string;
}

// ============================================================================
// QUALITY ASSESSMENT (parsed from vision model)
// ============================================================================

/** Raw structured output from the vision model */
export interface QualityAssessment {
  overall_score: number;
  layout_accuracy: number;
  visual_polish: number;
  completeness: number;
  issues: Array<{
    category: string;
    severity: string;
    description: string;
  }>;
  suggestions: string[];
  verdict: string;
}

// ============================================================================
// API TYPES
// ============================================================================

/** Request body for POST /api/layout/critique */
export interface CritiqueRequest {
  /** The generated code files to evaluate */
  files: Array<{ path: string; content: string }>;
  /** The original user instructions (for comparison) */
  originalInstructions: string;
  /** Optional app context for personalized evaluation */
  appContext?: {
    name?: string;
    colorScheme?: string;
    style?: string;
  };
}

/** Response from POST /api/layout/critique */
export interface CritiqueResponse {
  success: boolean;
  critique?: CritiqueResult;
  error?: string;
}
