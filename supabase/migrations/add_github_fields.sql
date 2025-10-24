-- Migration: Add GitHub repository fields to projects table
-- Date: 2025-10-24
-- Description: Store GitHub repository information for each generated project

-- Add columns for GitHub repository
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS github_repo_url TEXT,
ADD COLUMN IF NOT EXISTS github_repo_full_name TEXT,
ADD COLUMN IF NOT EXISTS github_clone_url TEXT;

-- Add index for lookups
CREATE INDEX IF NOT EXISTS idx_projects_github_repo ON projects(github_repo_full_name);

-- Comments for documentation
COMMENT ON COLUMN projects.github_repo_url IS 'GitHub repository URL (https://github.com/org/repo)';
COMMENT ON COLUMN projects.github_repo_full_name IS 'GitHub repository full name (org/repo)';
COMMENT ON COLUMN projects.github_clone_url IS 'GitHub clone URL for the repository';
