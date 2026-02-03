-- ============================================================================
-- Skill Library (Vector-Embedded Solution Cache)
-- ============================================================================
-- Enables pgvector and creates the skill_library table for storing
-- AI-generated solutions with vector embeddings for similarity search.
--
-- Skills are saved after AutonomyCore successfully solves a problem
-- and the solution passes WebContainer validation.
-- ============================================================================

-- Enable pgvector extension (safe to re-run)
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- TABLE: skill_library
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.skill_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- What was asked and how it was solved
  goal_description TEXT NOT NULL,
  reasoning_summary TEXT NOT NULL,

  -- Categorization
  tags TEXT[] DEFAULT '{}',

  -- The solution itself
  solution_code TEXT NOT NULL,
  solution_files JSONB DEFAULT '[]'::jsonb,

  -- Vector embedding for similarity search (OpenAI text-embedding-3-small: 1536 dims)
  embedding vector(1536) NOT NULL,

  -- Quality and usage tracking
  quality_score FLOAT DEFAULT 0.5 CHECK (quality_score >= 0 AND quality_score <= 1),
  usage_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- IVFFlat index for fast approximate nearest neighbor search
-- Lists = 100 is appropriate for up to ~100K rows per user
CREATE INDEX IF NOT EXISTS skill_library_embedding_idx
  ON public.skill_library
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Fast lookups by user
CREATE INDEX IF NOT EXISTS skill_library_user_id_idx
  ON public.skill_library (user_id);

-- Quality-filtered queries
CREATE INDEX IF NOT EXISTS skill_library_quality_idx
  ON public.skill_library (user_id, quality_score DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.skill_library ENABLE ROW LEVEL SECURITY;

-- Users can only see their own skills
CREATE POLICY skill_library_select_own ON public.skill_library
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own skills
CREATE POLICY skill_library_insert_own ON public.skill_library
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own skills
CREATE POLICY skill_library_update_own ON public.skill_library
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own skills
CREATE POLICY skill_library_delete_own ON public.skill_library
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- FUNCTION: match_skills
-- ============================================================================
-- Performs vector similarity search for a given user.
-- Returns skills ranked by cosine similarity above the given threshold.

CREATE OR REPLACE FUNCTION public.match_skills(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.78,
  match_count INT DEFAULT 5,
  filter_user_id UUID DEFAULT auth.uid(),
  min_quality FLOAT DEFAULT 0.0
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  goal_description TEXT,
  reasoning_summary TEXT,
  tags TEXT[],
  solution_code TEXT,
  solution_files JSONB,
  quality_score FLOAT,
  usage_count INTEGER,
  created_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sl.id,
    sl.user_id,
    sl.goal_description,
    sl.reasoning_summary,
    sl.tags,
    sl.solution_code,
    sl.solution_files,
    sl.quality_score,
    sl.usage_count,
    sl.created_at,
    sl.last_used_at,
    1 - (sl.embedding <=> query_embedding) AS similarity
  FROM public.skill_library sl
  WHERE sl.user_id = filter_user_id
    AND sl.quality_score >= min_quality
    AND 1 - (sl.embedding <=> query_embedding) > match_threshold
  ORDER BY sl.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================================================
-- FUNCTION: increment_skill_usage
-- ============================================================================
-- Increments usage_count and updates last_used_at for a skill.

CREATE OR REPLACE FUNCTION public.increment_skill_usage(skill_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.skill_library
  SET
    usage_count = usage_count + 1,
    last_used_at = NOW()
  WHERE id = skill_id
    AND user_id = auth.uid();
END;
$$;
