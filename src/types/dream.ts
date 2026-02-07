/**
 * Dream Mode Types
 *
 * Type definitions for the autonomous maintenance system ("Dream Mode").
 * Dream Mode runs in a dedicated browser tab, ingesting external repositories,
 * discovering orphaned features, building queued directives, finding bugs via
 * a Chaos Monkey agent, and fixing them in a self-healing loop.
 *
 * Modules:
 *   1. Repo Loader — GitHub zip download → WebContainer mount
 *   2. Dependency Graph — Import scanning + impact analysis
 *   3. Chaos Monkey — Vitest + happy-dom integration testing
 *   4. Maintenance Campaign — Self-healing priority loop
 *   5. Directive Queue — User + discovery goal management
 *   7. Feature Discovery — Orphaned feature detection
 */

// ============================================================================
// CHAOS PROFILES
// ============================================================================

/** Chaos Monkey testing intensity configuration */
export interface ChaosProfile {
  /** Milliseconds between simulated actions (lower = more aggressive) */
  actionDelay: number;
  /** Maximum session duration in seconds */
  sessionDuration: number;
  /** Maximum bugs to fix per dream cycle (cost control) */
  maxFixesPerCycle: number;
  /** Number of concurrent test threads (keep at 1 for WebContainer) */
  concurrentGremlins: number;
}

/** Named chaos profile presets */
export type ChaosProfileName = 'NAP' | 'REM' | 'NIGHTMARE';

// ============================================================================
// CRASH REPORTS
// ============================================================================

/** Severity of a discovered crash */
export type CrashSeverity = 'low' | 'medium' | 'high' | 'critical';

/** A single crash/error found during chaos testing */
export interface CrashEntry {
  /** Error message */
  error: string;
  /** Full stack trace if available */
  stackTrace?: string;
  /** Steps that led to this crash (for reproduction) */
  stepsToReproduce: string[];
  /** How severe this crash is */
  severity: CrashSeverity;
  /** Source file where the error originated */
  file?: string;
  /** Line number in the source file */
  line?: number;
  /** The test name that caught this crash */
  testName?: string;
}

/** Complete report from a chaos testing session */
export interface CrashReport {
  /** Unique report identifier */
  id: string;
  /** All crashes found during this session */
  crashes: CrashEntry[];
  /** When the test session started */
  timestamp: number;
  /** How long the session ran (ms) */
  duration: number;
  /** Which testing strategy was used */
  strategy: 'vitest' | 'iframe' | 'both';
  /** Number of tests executed */
  testsRun: number;
  /** Number of tests that passed */
  testsPassed: number;
}

// ============================================================================
// DEPENDENCY GRAPH
// ============================================================================

/** A node in the project dependency graph */
export interface DependencyNode {
  /** File path */
  file: string;
  /** Files this file imports */
  imports: string[];
  /** Files that import this file (reverse edges) */
  importedBy: string[];
}

/** Complete dependency graph for a project */
export interface DependencyGraph {
  /** Map of file path → dependency node */
  nodes: Map<string, DependencyNode>;
  /** Get all files impacted by a change to the given file (transitive dependents) */
  getImpacted(changedFile: string): string[];
}

// ============================================================================
// PATCHES
// ============================================================================

/** A code patch applied during a dream cycle */
export interface DreamPatch {
  /** File that was patched */
  file: string;
  /** Code before the patch */
  before: string;
  /** Code after the patch */
  after: string;
  /** Crash report that triggered this patch (if bug fix) */
  crashId?: string;
  /** Goal that triggered this patch (if feature build) */
  goalId?: string;
  /** Whether the patch was verified to work */
  verified: boolean;
  /** Timestamp of when the patch was applied */
  appliedAt: number;
}

// ============================================================================
// DREAM LOGS
// ============================================================================

/** Complete log of a single dream cycle */
export interface DreamLog {
  /** Unique log identifier */
  id: string;
  /** When the dream cycle started */
  startedAt: number;
  /** When the dream cycle ended */
  endedAt: number;
  /** Number of directed goals completed */
  goalsCompleted: number;
  /** Number of bugs discovered by Chaos Monkey */
  bugsFound: number;
  /** Number of bugs successfully fixed */
  bugsFixed: number;
  /** Number of orphaned features discovered */
  discoveries: number;
  /** All crash reports from this cycle */
  crashReports: CrashReport[];
  /** All patches applied during this cycle */
  patches: DreamPatch[];
  /** Chaos profile used for this cycle */
  profileUsed: ChaosProfileName;
  /** Repository URL that was targeted */
  repoUrl: string;
  /** How the cycle ended */
  stopReason: 'budget_exhausted' | 'time_limit' | 'all_stable' | 'user_stopped' | 'error';
}

// ============================================================================
// DIRECTIVE QUEUE (Module 5)
// ============================================================================

/** Status of a dream goal/directive */
export type DreamGoalStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

/** Source of a dream goal */
export type DreamGoalSource = 'user' | 'discovery' | 'spec' | 'temporal';

/** A goal/directive in the dream queue */
export interface DreamGoal {
  /** Unique goal identifier */
  id: string;
  /** Natural language description of what to build/fix */
  prompt: string;
  /** Current status */
  status: DreamGoalStatus;
  /** Where this goal came from */
  source: DreamGoalSource;
  /** When the goal was created */
  createdAt: number;
  /** When the goal was completed (if completed) */
  completedAt?: number;
  /** Error message if the goal failed */
  errorMessage?: string;
}

// ============================================================================
// FEATURE DISCOVERY (Module 7)
// ============================================================================

/** Connectivity status of a discovered feature */
export type FeatureStatus = 'ACTIVE' | 'PARTIALLY_CONNECTED' | 'DISCONNECTED';

/** A feature discovered during code archaeology */
export interface DiscoveredFeature {
  /** File path of the feature */
  file: string;
  /** AI-inferred purpose of this feature */
  inferredPurpose: string;
  /** Connectivity status relative to entry points */
  status: FeatureStatus;
  /** Files that import/consume this feature */
  consumers: string[];
  /** Suggested action to wire this feature in */
  suggestedAction: string;
}

/** Complete report from a discovery scan */
export interface DiscoveryReport {
  /** Total files scanned */
  scannedFiles: number;
  /** All discovered features with their status */
  discoveries: DiscoveredFeature[];
  /** When the scan was performed */
  timestamp: number;
  /** How long the scan took (ms) */
  duration: number;
}

// ============================================================================
// DREAM SETTINGS
// ============================================================================

/** Dream Mode configuration persisted in settings */
export interface DreamSettings {
  /** Whether Dream Mode is enabled */
  enabled: boolean;
  /** GitHub repository URL (owner/repo format) */
  repoUrl: string;
  /** GitHub Personal Access Token for private repos */
  githubToken: string;
  /** Which chaos profile to use */
  chaosProfile: ChaosProfileName;
  /** Whether to auto-commit fixes back to the repo */
  autoCommit: boolean;
  /** The queue of goals/directives to execute */
  goalQueue: DreamGoal[];
}

// ============================================================================
// CAMPAIGN STATE
// ============================================================================

/** Current phase of the maintenance campaign */
export type CampaignPhase =
  | 'IDLE'
  | 'LOADING'
  | 'DISCOVERING'
  | 'BUILDING_GOAL'
  | 'CHAOS_TESTING'
  | 'DIAGNOSING'
  | 'PATCHING'
  | 'VERIFYING'
  | 'LOGGING'
  | 'DONE';

/** Real-time stats during a dream cycle */
export interface DreamStats {
  /** Current campaign phase */
  phase: CampaignPhase;
  /** Elapsed time since cycle start (ms) */
  elapsed: number;
  /** Number of goals completed so far */
  goalsCompleted: number;
  /** Number of bugs found so far */
  bugsFound: number;
  /** Number of bugs fixed so far */
  bugsFixed: number;
  /** Number of discoveries made */
  discoveries: number;
  /** Actions remaining in budget */
  budgetRemaining: number;
  /** Current goal being worked on (if any) */
  currentGoal?: string;
}

// ============================================================================
// INTERACTABLE ELEMENTS (for Chaos Monkey)
// ============================================================================

/** Type of interactive UI element */
export type InteractableType = 'button' | 'input' | 'link' | 'form' | 'select' | 'textarea' | 'checkbox' | 'radio';

/** An interactive element found during UI analysis */
export interface InteractableElement {
  /** Element type */
  type: InteractableType;
  /** CSS selector or test ID to target this element */
  selector: string;
  /** Human-readable label (button text, input placeholder, etc.) */
  label: string;
  /** Source file where this element is defined */
  file: string;
  /** Line number in the source file */
  line: number;
  /** Event handlers attached (onClick, onSubmit, onChange, etc.) */
  handlers: string[];
}

// ============================================================================
// CAMPAIGN CALLBACKS
// ============================================================================

/** Callback for real-time log messages during a dream cycle */
export type DreamLogCallback = (message: string) => void;

/** Callback for phase changes during a dream cycle */
export type PhaseChangeCallback = (phase: CampaignPhase) => void;

/** Callback for stats updates during a dream cycle */
export type StatsUpdateCallback = (stats: DreamStats) => void;

/**
 * Callback for requesting iframe-based chaos testing (Strategy B).
 * The campaign calls this with the generated script and list of elements.
 * The UI layer injects the script into the preview iframe and returns a CrashReport.
 * Returns null if the iframe is unavailable.
 */
export type IframeTestRequestCallback = (
  script: string,
) => Promise<CrashReport | null>;
