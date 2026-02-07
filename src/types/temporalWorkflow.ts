/**
 * Temporal Workflow Types
 *
 * Types for the Temporal Workflow Simulator (Module 7).
 * Defines workflow steps, definitions, and results for testing
 * time-dependent business logic.
 */

// ============================================================================
// WORKFLOW STEPS
// ============================================================================

/** An action step that executes code against the running app */
export interface WorkflowActionStep {
  type: 'action';
  /** Human-readable description of what this step does */
  description: string;
  /** JavaScript code to execute (e.g., "createUser('test@example.com')") */
  code: string;
}

/** A wait step that fast-forwards the simulated clock */
export interface WorkflowWaitStep {
  type: 'wait';
  /** Duration string — e.g., "7d", "24h", "30m", "10s" */
  duration: string;
}

/** An assertion step that validates state after time has passed */
export interface WorkflowAssertionStep {
  type: 'assertion';
  /** JavaScript expression to evaluate (e.g., "checkUserStatus() === 'archived'") */
  expression: string;
  /** Expected result of the expression */
  expected: boolean | string | number;
  /** Human-readable description of what we're checking */
  description: string;
}

/** A single step in a workflow pipeline */
export type WorkflowStep = WorkflowActionStep | WorkflowWaitStep | WorkflowAssertionStep;

// ============================================================================
// WORKFLOW DEFINITION
// ============================================================================

/** A complete workflow pipeline to simulate and test */
export interface WorkflowDefinition {
  /** Unique identifier */
  id: string;
  /** Human-readable name (e.g., "Free Trial Billing") */
  name: string;
  /** Ordered list of steps to execute */
  steps: WorkflowStep[];
  /** Source file where the temporal logic was discovered */
  sourceFile?: string;
}

// ============================================================================
// WORKFLOW RESULTS
// ============================================================================

/** Status of a single workflow step execution */
export interface WorkflowStepResult {
  /** Index of the step in the workflow */
  stepIndex: number;
  /** Whether this step passed */
  passed: boolean;
  /** Human-readable log entry */
  message: string;
  /** Actual value returned (for assertion steps) */
  actualValue?: string;
}

/** Result of running a complete workflow simulation */
export interface WorkflowResult {
  /** ID of the workflow that was run */
  workflowId: string;
  /** Name of the workflow */
  workflowName: string;
  /** Whether the entire workflow passed */
  success: boolean;
  /** Number of steps that passed */
  stepsPassed: number;
  /** Total number of steps */
  totalSteps: number;
  /** Why the workflow failed (if applicable) */
  failureReason?: string;
  /** Per-step results */
  stepResults: WorkflowStepResult[];
  /** Chronological log of the simulation */
  history: string[];
  /** How long the simulation took (ms) */
  duration: number;
}

// ============================================================================
// TIME STATE
// ============================================================================

/** Tracks the state of the simulated clock */
export interface TimeState {
  /** Original real timestamp when simulation started */
  realStartTime: number;
  /** Current simulated offset from real time (ms) */
  offsetMs: number;
  /** Whether the time mock is currently active */
  isActive: boolean;
}
