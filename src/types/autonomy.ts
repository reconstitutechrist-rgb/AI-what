/**
 * Autopoietic System Types
 * 
 * Definitions for the Self-Teaching / Self-Evolving architecture.
 */

// ============================================================================
// STRATEGY & PLANNING
// ============================================================================

export type StrategyPhase = 'RESEARCH' | 'DESIGN' | 'CODE' | 'REVIEW';

export interface AutonomyGoal {
  id: string;
  description: string; // "Create a 3D Metaverse scene"
  context: string; // The current file, component, or error that triggered this
  technical_constraints: string[];
}

export interface StrategicPlan {
  goal_id: string;
  strategy_reasoning: string;
  steps: StrategyStep[];
}

export interface StrategyStep {
  id: string;
  type: StrategyPhase;
  description: string; // "Research Three.js best practices"
  dependencies: string[]; // IDs of steps that must finish first
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  result_summary?: string;
  assigned_agent_id?: string;
}

// ============================================================================
// AGENT FABRICATION
// ============================================================================

export type AgentRole = 'RESEARCHER' | 'ARCHITECT' | 'CODER' | 'REVIEWER' | 'DEBUGGER';

export interface FabricatedAgent {
  id: string;
  name: string;
  role: AgentRole;
  system_prompt: string;
  capabilities: string[]; // ["google_search", "read_file", "write_code"]
  temperature: number;
}

export interface AgentSwarm {
  id: string;
  mission: string;
  agents: FabricatedAgent[];
}

// ============================================================================
// WORKFLOW EXECUTION
// ============================================================================

export interface WorkflowContext {
  memory: Record<string, any>; // Shared memory for the swarm
  global_files: Record<string, string>; // Virtual file system for the task
  logs: string[];
}

export interface AgentTaskResult {
  success: boolean;
  output: string;
  artifacts?: any[]; // Code blocks, links found, etc.
  error?: string;
  retry_suggestion?: string;
  /** Summary of the architect's reasoning (captured for Skill Library) */
  reasoning_summary?: string;
  /** Avatar Protocol: Command to be executed by the client */
  command?: AgentCommand;
  /** Avatar Protocol: State to persist while waiting for feedback */
  suspendedState?: SuspendedExecution;
}

// ============================================================================
// SEARCH & KNOWLEDGE
// ============================================================================

export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
}

export interface KnowledgeFragment {
  topic: string;
  content: string;
  source_url?: string;
  confidence: number;
}

// ============================================================================
// AVATAR PROTOCOL (Remote Execution)
// ============================================================================

export type AgentCommandType = 'shell' | 'screenshot' | 'browser_log';

export interface AgentCommand {
  id: string;
  type: AgentCommandType;
  command?: string;      // For 'shell' (e.g., "npm test")
  timeout?: number;
}

export interface AgentFeedback {
  commandId: string;
  output: string;
  exitCode: number;
  screenshot?: string;   // Base64 data URI
}

export interface SuspendedExecution {
  step: StrategyStep;
  agentId: string;
  command: AgentCommand;
  swarmId: string;
  swarm: AgentSwarm; // Full swarm definition for stateless resumption
  memory: Record<string, any>; // Snapshot of memory
}
