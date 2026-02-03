/**
 * Sandbox Types
 *
 * Type definitions for the WebContainer-based code validation
 * and AI-powered code repair system.
 */

import type { AppFile } from '@/types/railway';

// ============================================================================
// VALIDATION
// ============================================================================

/** Result of validating generated code in the WebContainer sandbox */
export interface ValidationResult {
  /** Whether all files compiled and rendered without errors */
  valid: boolean;
  /** Errors found during validation */
  errors: SandboxError[];
  /** Non-fatal warnings */
  warnings: string[];
  /** How long validation took (ms) */
  duration: number;
}

/** A specific error encountered during sandbox validation */
export interface SandboxError {
  /** Error category */
  type: 'syntax' | 'import' | 'runtime' | 'build' | 'unknown';
  /** Human-readable error message */
  message: string;
  /** File where the error occurred (if known) */
  file?: string;
  /** Line number (if known) */
  line?: number;
  /** Column number (if known) */
  column?: number;
  /** Raw error output from the build tool */
  raw?: string;
}

// ============================================================================
// EXECUTION
// ============================================================================

/** Result of running a process in the WebContainer */
export interface ExecutionResult {
  /** Exit code (0 = success) */
  exitCode: number;
  /** Combined stdout output */
  stdout: string;
  /** Combined stderr output */
  stderr: string;
}

/** Status of the WebContainer instance */
export type WebContainerStatus =
  | 'idle'
  | 'booting'
  | 'ready'
  | 'running'
  | 'validating'
  | 'installing'
  | 'building'
  | 'error';

// ============================================================================
// REPAIR
// ============================================================================

/** Request to the AI code repair service */
export interface RepairRequest {
  /** The files that failed validation */
  files: AppFile[];
  /** Errors that need to be fixed */
  errors: SandboxError[];
  /** Original user instructions (for context) */
  originalInstructions: string;
  /** Which repair attempt this is (1-based) */
  attempt: number;
}

/** Result of an AI code repair attempt */
export interface RepairResult {
  /** Whether repair was attempted (false if errors were unfixable) */
  attempted: boolean;
  /** The repaired files (if successful) */
  files: AppFile[];
  /** Description of what was fixed */
  fixes: string[];
  /** Any errors that could not be fixed */
  remainingErrors: SandboxError[];
}

// ============================================================================
// VALIDATION PIPELINE STATE (for UI)
// ============================================================================

/** Validation state exposed to the UI layer */
export interface ValidationState {
  /** Whether validation is currently running */
  isValidating: boolean;
  /** Current validation status */
  status: WebContainerStatus;
  /** Errors from the most recent validation */
  validationErrors: SandboxError[];
  /** Number of auto-repair attempts made */
  repairAttempts: number;
  /** Maximum auto-repair attempts allowed */
  maxRepairAttempts: number;
}
