-- Migration pour supporter les projets multi-fichiers avec bases de données dédiées

-- 1. Modifier la table projects pour ajouter les nouveaux champs
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS storage_path TEXT, -- Chemin dans Supabase Storage
ADD COLUMN IF NOT EXISTS database_url TEXT, -- URL de connexion Neon
ADD COLUMN IF NOT EXISTS database_id TEXT, -- ID du projet Neon
ADD COLUMN IF NOT EXISTS deployment_url TEXT, -- URL Vercel
ADD COLUMN IF NOT EXISTS preview_url TEXT, -- URL de preview
ADD COLUMN IF NOT EXISTS framework TEXT DEFAULT 'react', -- Framework utilisé
ADD COLUMN IF NOT EXISTS has_database BOOLEAN DEFAULT false; -- Si le projet a une DB

-- 2. Créer un index sur storage_path pour performance
CREATE INDEX IF NOT EXISTS idx_projects_storage_path ON projects(storage_path);

-- 3. Créer une table pour stocker les métadonnées des fichiers
CREATE TABLE IF NOT EXISTS project_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL, -- ex: "src/App.jsx"
  file_type TEXT, -- "component", "hook", "style", "config", etc.
  size_bytes INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, file_path)
);

-- 4. Index pour performance
CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON project_files(project_id);

-- 5. Enable RLS sur project_files
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;

-- 6. Policies pour project_files
CREATE POLICY "Users can view their own project files"
ON project_files FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_files.project_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own project files"
ON project_files FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_files.project_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own project files"
ON project_files FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_files.project_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own project files"
ON project_files FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_files.project_id
    AND projects.user_id = auth.uid()
  )
);

-- 7. Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Trigger pour project_files
CREATE TRIGGER update_project_files_updated_at BEFORE UPDATE ON project_files
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. Créer une vue pour avoir les stats des projets
CREATE OR REPLACE VIEW project_stats AS
SELECT
  p.id,
  p.name,
  p.user_id,
  p.framework,
  p.has_database,
  COUNT(pf.id) as file_count,
  SUM(pf.size_bytes) as total_size_bytes,
  p.created_at,
  p.updated_at
FROM projects p
LEFT JOIN project_files pf ON p.id = pf.project_id
GROUP BY p.id;

-- 10. Commentaires pour documentation
COMMENT ON COLUMN projects.storage_path IS 'Chemin du projet dans Supabase Storage (ex: users/123/project-456)';
COMMENT ON COLUMN projects.database_url IS 'URL de connexion à la base de données Neon dédiée';
COMMENT ON COLUMN projects.database_id IS 'ID du projet dans Neon';
COMMENT ON COLUMN projects.deployment_url IS 'URL du projet déployé sur Vercel';
COMMENT ON COLUMN projects.preview_url IS 'URL temporaire de preview';
COMMENT ON COLUMN projects.framework IS 'Framework utilisé (react, vue, svelte, html)';
COMMENT ON COLUMN projects.has_database IS 'Indique si le projet a une base de données dédiée';
