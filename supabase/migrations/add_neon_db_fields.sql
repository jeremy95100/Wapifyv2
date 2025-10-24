-- Migration: Add Neon database fields to projects table
-- Date: 2025-10-24
-- Description: Ajoute les champs pour stocker les informations de la base de données Neon

-- Ajouter les colonnes pour la DB Neon
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS db_branch_id TEXT,
ADD COLUMN IF NOT EXISTS db_connection_string TEXT,
ADD COLUMN IF NOT EXISTS database_schema JSONB;

-- Ajouter un index sur db_branch_id pour les recherches
CREATE INDEX IF NOT EXISTS idx_projects_db_branch_id ON projects(db_branch_id);

-- Commenter les colonnes pour la documentation
COMMENT ON COLUMN projects.db_branch_id IS 'ID de la branche Neon pour ce projet (si hasDatabase=true)';
COMMENT ON COLUMN projects.db_connection_string IS 'Connection string PostgreSQL pour la DB dédiée';
COMMENT ON COLUMN projects.database_schema IS 'Schéma JSON de la base de données (tables et colonnes)';
