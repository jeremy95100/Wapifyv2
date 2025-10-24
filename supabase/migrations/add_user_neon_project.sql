-- Migration: Add user Neon project ID to projects table
-- Date: 2025-10-24
-- Description: Store the Neon project ID for each user (1 Neon project per user)

-- Add column to store user's Neon project ID
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS user_neon_project_id TEXT;

-- Add index for lookups
CREATE INDEX IF NOT EXISTS idx_projects_user_neon_project_id ON projects(user_neon_project_id);

-- Comment for documentation
COMMENT ON COLUMN projects.user_neon_project_id IS 'Neon project ID for this user (1 project per user, 10 branches max)';
