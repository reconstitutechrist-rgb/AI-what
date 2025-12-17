-- Migration: Create project_documentation table
-- Purpose: Store all artifacts from the app building process for user review and tracking

-- Create project_documentation table
CREATE TABLE IF NOT EXISTS project_documentation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID NOT NULL,
  user_id UUID NOT NULL,

  -- Project identification
  project_name TEXT NOT NULL,
  project_description TEXT,

  -- Artifact snapshots (JSONB for complex nested data)
  concept_snapshot JSONB,
  layout_snapshot JSONB,
  plan_snapshot JSONB,

  -- Build tracking
  build_status TEXT DEFAULT 'planning' CHECK (build_status IN ('planning', 'ready', 'building', 'completed', 'failed', 'paused')),
  build_started_at TIMESTAMPTZ,
  build_completed_at TIMESTAMPTZ,
  phase_executions JSONB DEFAULT '[]'::JSONB,

  -- Stats
  stats JSONB DEFAULT '{
    "totalFeatures": 0,
    "implementedFeatures": 0,
    "totalPhases": 0,
    "completedPhases": 0,
    "failedPhases": 0,
    "skippedPhases": 0
  }'::JSONB,

  -- User additions
  notes TEXT,
  tags TEXT[] DEFAULT '{}',

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  version INTEGER DEFAULT 1,

  -- Foreign key to generated_apps (if it exists)
  -- Note: This is a soft reference - app_id may reference apps not yet in generated_apps
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_project_docs_user ON project_documentation(user_id);
CREATE INDEX IF NOT EXISTS idx_project_docs_app ON project_documentation(app_id);
CREATE INDEX IF NOT EXISTS idx_project_docs_status ON project_documentation(build_status);
CREATE INDEX IF NOT EXISTS idx_project_docs_updated ON project_documentation(updated_at DESC);

-- Enable Row Level Security
ALTER TABLE project_documentation ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own documentation
CREATE POLICY "Users can view own documentation" ON project_documentation
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documentation" ON project_documentation
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documentation" ON project_documentation
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own documentation" ON project_documentation
  FOR DELETE USING (auth.uid() = user_id);

-- Function to auto-update updated_at and increment version
CREATE OR REPLACE FUNCTION update_project_doc_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamp on update
DROP TRIGGER IF EXISTS project_doc_updated ON project_documentation;
CREATE TRIGGER project_doc_updated
  BEFORE UPDATE ON project_documentation
  FOR EACH ROW EXECUTE FUNCTION update_project_doc_timestamp();

-- Add comment for documentation
COMMENT ON TABLE project_documentation IS 'Stores project documentation artifacts including app concept, layout design, implementation plan, and phase execution history';
COMMENT ON COLUMN project_documentation.concept_snapshot IS 'Snapshot of AppConcept from wizard or builder chat';
COMMENT ON COLUMN project_documentation.layout_snapshot IS 'Snapshot of LayoutDesign with preview image URL';
COMMENT ON COLUMN project_documentation.plan_snapshot IS 'Snapshot of DynamicPhasePlan with phase details';
COMMENT ON COLUMN project_documentation.phase_executions IS 'Array of phase execution records with status and results';
