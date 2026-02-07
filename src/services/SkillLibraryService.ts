/**
 * Skill Library Service
 *
 * Manages the vector-embedded skill cache in Supabase pgvector.
 * Skills represent successfully solved + validated code solutions.
 *
 * Save path:
 *   AutonomyCore solves problem -> Sandbox validates -> SkillLibrary.saveSkill()
 *
 * Query path:
 *   User request -> EmbeddingService.embed() -> SkillLibrary.findSimilarSkills()
 *   If match found -> return cached solution (skip full autonomy)
 *
 * Server-side only — called from API routes.
 */

import { createClient } from '@/utils/supabase/server';
import { getEmbeddingService } from './EmbeddingService';
import type {
  Skill,
  SkillMatch,
  SkillQuery,
  SaveSkillInput,
  SkillFile,
} from '@/types/skillLibrary';

// ============================================================================
// CONFIGURATION
// ============================================================================

/** Default similarity threshold for matching */
const DEFAULT_SIMILARITY_THRESHOLD = 0.78;

/** Default max results returned */
const DEFAULT_MATCH_LIMIT = 5;

/** Minimum quality score for query results */
const DEFAULT_MIN_QUALITY = 0.0;

// ============================================================================
// SERVICE
// ============================================================================

class SkillLibraryServiceInstance {
  /**
   * Find skills similar to a given query.
   * Uses pgvector cosine similarity via the match_skills() RPC function.
   */
  async findSimilarSkills(query: SkillQuery): Promise<SkillMatch[]> {
    const embeddingService = getEmbeddingService();
    const supabase = await createClient();

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.warn('[SkillLibrary] No authenticated user, skipping skill query');
      return [];
    }

    // Generate embedding for the query if not provided
    const embedding = query.embedding ?? await embeddingService.embed(query.query);

    const threshold = query.similarityThreshold ?? DEFAULT_SIMILARITY_THRESHOLD;
    const limit = query.limit ?? DEFAULT_MATCH_LIMIT;
    const minQuality = query.minQualityScore ?? DEFAULT_MIN_QUALITY;

    // Call the match_skills() RPC function
    const { data, error } = await supabase.rpc('match_skills', {
      query_embedding: embedding,
      match_threshold: threshold,
      match_count: limit,
      filter_user_id: user.id,
      min_quality: minQuality,
    });

    if (error) {
      console.error('[SkillLibrary] Query error:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Map RPC results to SkillMatch[]
    return data.map((row: Record<string, unknown>) => ({
      skill: {
        id: row.id as string,
        user_id: row.user_id as string,
        goal_description: row.goal_description as string,
        reasoning_summary: row.reasoning_summary as string,
        tags: (row.tags as string[]) || [],
        solution_code: row.solution_code as string,
        solution_files: (row.solution_files as SkillFile[]) || [],
        embedding: [], // Don't return the full embedding vector to clients
        quality_score: row.quality_score as number,
        usage_count: row.usage_count as number,
        created_at: row.created_at as string,
        last_used_at: row.last_used_at as string,
      } satisfies Skill,
      similarity: row.similarity as number,
    }));
  }

  /**
   * Save a new skill to the library.
   * Generates an embedding and inserts into Supabase.
   */
  async saveSkill(input: SaveSkillInput): Promise<{ skillId: string } | null> {
    const embeddingService = getEmbeddingService();
    const supabase = await createClient();

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('[SkillLibrary] saveSkill failed — no authenticated user:', {
        error: authError?.message,
        code: authError?.code,
        goal: input.goalDescription.slice(0, 100),
      });
      return null;
    }

    // Generate embedding from goal + reasoning
    const embeddingText = embeddingService.buildSkillText(
      input.goalDescription,
      input.reasoningSummary,
      input.tags
    );
    const embedding = await embeddingService.embed(embeddingText);

    // Check for near-duplicate (same user, high semantic similarity)
    // Threshold 0.88 catches synonym variations ("Build X" vs "Create X" ~0.89)
    // without false-positive merging of genuinely different requests
    const duplicateCheck = await this.findSimilarSkills({
      query: input.goalDescription,
      embedding,
      similarityThreshold: 0.88,
      limit: 1,
    });

    if (duplicateCheck.length > 0) {
      // Update existing skill instead of creating duplicate
      const existingId = duplicateCheck[0].skill.id;
      await this.updateSkill(existingId, {
        solutionCode: input.solutionCode,
        solutionFiles: input.solutionFiles,
        qualityScore: input.qualityScore,
        reasoningSummary: input.reasoningSummary,
      });
      console.log(`[SkillLibrary] Updated existing skill ${existingId} (near-duplicate)`);
      return { skillId: existingId };
    }

    // Insert new skill
    const { data, error } = await supabase
      .from('skill_library')
      .insert({
        user_id: user.id,
        goal_description: input.goalDescription,
        reasoning_summary: input.reasoningSummary,
        tags: input.tags,
        solution_code: input.solutionCode,
        solution_files: input.solutionFiles,
        embedding,
        quality_score: Math.max(0, Math.min(1, input.qualityScore ?? 0.5)),
      })
      .select('id')
      .single();

    if (error) {
      console.error('[SkillLibrary] Save error:', error);
      return null;
    }

    console.log(`[SkillLibrary] Saved new skill ${data.id}`);
    return { skillId: data.id };
  }

  /**
   * Update an existing skill's solution and/or quality score.
   */
  async updateSkill(
    skillId: string,
    updates: {
      solutionCode?: string;
      solutionFiles?: SkillFile[];
      qualityScore?: number;
      reasoningSummary?: string;
    }
  ): Promise<boolean> {
    const supabase = await createClient();

    const updatePayload: Record<string, unknown> = {};
    if (updates.solutionCode !== undefined) updatePayload.solution_code = updates.solutionCode;
    if (updates.solutionFiles !== undefined) updatePayload.solution_files = updates.solutionFiles;
    if (updates.qualityScore !== undefined) updatePayload.quality_score = updates.qualityScore;
    if (updates.reasoningSummary !== undefined) updatePayload.reasoning_summary = updates.reasoningSummary;

    if (Object.keys(updatePayload).length === 0) return true;

    const { error } = await supabase
      .from('skill_library')
      .update(updatePayload)
      .eq('id', skillId);

    if (error) {
      console.error('[SkillLibrary] Update error:', error);
      return false;
    }

    return true;
  }

  /**
   * Increment usage count for a skill (called when a cached skill is reused).
   */
  async incrementUsage(skillId: string): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase.rpc('increment_skill_usage', {
      skill_id: skillId,
    });

    if (error) {
      console.error('[SkillLibrary] Usage increment error:', error);
    }
  }

  /**
   * Update the quality score of a skill (called by Visual Critic).
   * Score is 0-10 from the critic, normalized to 0-1 for storage.
   */
  async updateQualityScore(skillId: string, criticScore: number): Promise<void> {
    const normalizedScore = Math.max(0, Math.min(1, criticScore / 10));
    await this.updateSkill(skillId, { qualityScore: normalizedScore });
  }

  /**
   * Extract tags from a goal description using simple keyword extraction.
   * Used as a fallback when tags aren't provided.
   */
  extractTags(goalDescription: string): string[] {
    const techKeywords = [
      'react', 'three.js', 'threejs', 'webgl', 'canvas', 'animation',
      'chart', 'graph', 'dashboard', 'form', 'table', 'auth',
      'api', 'websocket', 'realtime', 'crud', 'search', 'filter',
      'drag', 'drop', 'modal', 'carousel', 'slider', 'map',
      'video', 'audio', 'image', 'gallery', 'upload', 'editor',
      'game', 'physics', 'shader', 'particle', 'markdown', 'code',
      'chat', 'notification', 'calendar', 'timeline', 'kanban',
      'tailwind', 'framer', 'motion', 'css', 'responsive', 'mobile',
    ];

    const lowerGoal = goalDescription.toLowerCase();
    return techKeywords.filter((kw) => lowerGoal.includes(kw));
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

let _instance: SkillLibraryServiceInstance | null = null;

export function getSkillLibraryService(): SkillLibraryServiceInstance {
  if (!_instance) {
    _instance = new SkillLibraryServiceInstance();
  }
  return _instance;
}

export type { SkillLibraryServiceInstance };
