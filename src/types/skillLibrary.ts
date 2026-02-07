/**
 * Skill Library Types
 *
 * Type definitions for the vector-embedded skill caching system.
 * Skills are saved after AutonomyCore successfully solves a problem
 * and the solution passes Sandbox validation. On future similar requests,
 * the system queries the library before routing to full autonomy.
 */

// ============================================================================
// CORE TYPES
// ============================================================================

/** A saved skill in the library (matches DB schema) */
export interface Skill {
  id: string;
  user_id: string;
  goal_description: string;
  reasoning_summary: string;
  tags: string[];
  solution_code: string;
  solution_files: SkillFile[];
  embedding: number[];
  /** Quality score stored as 0.0-1.0 (normalized from Visual Critic's 1-10 scale via /10) */
  quality_score: number;
  usage_count: number;
  created_at: string;
  last_used_at: string;
}

/** A file within a saved skill's solution */
export interface SkillFile {
  path: string;
  content: string;
}

// ============================================================================
// QUERY & MATCH
// ============================================================================

/** Parameters for querying the skill library */
export interface SkillQuery {
  /** The user's request to match against */
  query: string;
  /** Pre-computed embedding vector (if available) */
  embedding?: number[];
  /** Minimum cosine similarity threshold (0-1) */
  similarityThreshold?: number;
  /** Maximum number of results */
  limit?: number;
  /** Minimum quality score filter */
  minQualityScore?: number;
}

/** A skill match result from a similarity query */
export interface SkillMatch {
  skill: Skill;
  /** Cosine similarity score (0-1, higher = more similar) */
  similarity: number;
}

// ============================================================================
// SAVE INPUT
// ============================================================================

/** Input for saving a new skill to the library */
export interface SaveSkillInput {
  /** What the user asked for */
  goalDescription: string;
  /** How the AI reasoned about and solved it */
  reasoningSummary: string;
  /** Categorization tags */
  tags: string[];
  /** The main code solution (App.tsx content) */
  solutionCode: string;
  /** All solution files (for multi-file projects) */
  solutionFiles: SkillFile[];
  /** Quality score (0-1 scale). If from Visual Critic (0-10), caller must divide by 10 first. */
  qualityScore?: number;
}

// ============================================================================
// API TYPES
// ============================================================================

/** Request body for POST /api/skills (query) */
export interface SkillQueryRequest {
  query: string;
  similarityThreshold?: number;
  limit?: number;
  minQualityScore?: number;
}

/** Response from POST /api/skills (query) */
export interface SkillQueryResponse {
  matches: SkillMatch[];
  queryTime: number;
}

/** Request body for POST /api/skills/save */
export type SkillSaveRequest = SaveSkillInput;

/** Response from POST /api/skills/save */
export interface SkillSaveResponse {
  saved: boolean;
  skillId?: string;
  error?: string;
}
