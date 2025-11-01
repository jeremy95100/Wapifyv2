-- Table pour enregistrer les erreurs TypeScript détectées et corrigées
-- Utile pour améliorer le prompt de génération en analysant les erreurs récurrentes

CREATE TABLE IF NOT EXISTS typescript_errors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Lien avec le projet et le job
  project_id TEXT NOT NULL,
  job_id INTEGER,

  -- Informations sur l'erreur
  error_code TEXT NOT NULL, -- ex: "TS2304", "TS17001"
  error_message TEXT NOT NULL,
  file_path TEXT NOT NULL, -- ex: "src/pages/HomePage.tsx"
  line_number INTEGER NOT NULL,
  column_number INTEGER NOT NULL,

  -- Contexte de génération
  user_prompt TEXT, -- Le prompt utilisé pour générer le projet

  -- Correction automatique
  was_fixed BOOLEAN DEFAULT false,
  fix_applied_at TIMESTAMP,
  file_content_before TEXT, -- Contenu du fichier avant correction
  file_content_after TEXT, -- Contenu du fichier après correction

  -- Métriques
  detection_time_ms INTEGER, -- Temps pris pour détecter l'erreur
  fix_time_ms INTEGER, -- Temps pris pour corriger (appel Claude)

  -- Timestamps
  detected_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_typescript_errors_project_id ON typescript_errors(project_id);
CREATE INDEX IF NOT EXISTS idx_typescript_errors_job_id ON typescript_errors(job_id);
CREATE INDEX IF NOT EXISTS idx_typescript_errors_error_code ON typescript_errors(error_code);
CREATE INDEX IF NOT EXISTS idx_typescript_errors_detected_at ON typescript_errors(detected_at DESC);

-- Index composite pour analyses fréquentes
CREATE INDEX IF NOT EXISTS idx_typescript_errors_code_fixed ON typescript_errors(error_code, was_fixed);

-- Vue pour analyser les erreurs les plus fréquentes
CREATE OR REPLACE VIEW typescript_errors_stats AS
SELECT
  error_code,
  COUNT(*) as total_occurrences,
  COUNT(*) FILTER (WHERE was_fixed = true) as fixed_count,
  COUNT(*) FILTER (WHERE was_fixed = false) as unfixed_count,
  ROUND(AVG(detection_time_ms)) as avg_detection_time_ms,
  ROUND(AVG(fix_time_ms) FILTER (WHERE fix_time_ms IS NOT NULL)) as avg_fix_time_ms,
  ARRAY_AGG(DISTINCT file_path) as affected_files
FROM typescript_errors
GROUP BY error_code
ORDER BY total_occurrences DESC;

-- Vue pour analyser les erreurs par type de fichier
CREATE OR REPLACE VIEW typescript_errors_by_file_type AS
SELECT
  CASE
    WHEN file_path LIKE '%/pages/%' THEN 'pages'
    WHEN file_path LIKE '%/components/%' THEN 'components'
    WHEN file_path LIKE '%/lib/%' OR file_path LIKE '%/utils/%' THEN 'utils'
    WHEN file_path LIKE '%/hooks/%' THEN 'hooks'
    ELSE 'other'
  END as file_type,
  error_code,
  COUNT(*) as occurrences
FROM typescript_errors
GROUP BY file_type, error_code
ORDER BY file_type, occurrences DESC;

-- Vue pour analyser les patterns d'erreurs dans les prompts
CREATE OR REPLACE VIEW typescript_errors_by_prompt_pattern AS
SELECT
  error_code,
  error_message,
  COUNT(*) as occurrences,
  ARRAY_AGG(DISTINCT SUBSTRING(user_prompt FROM 1 FOR 100)) as prompt_samples
FROM typescript_errors
WHERE user_prompt IS NOT NULL
GROUP BY error_code, error_message
HAVING COUNT(*) >= 2 -- Seulement les erreurs qui se répètent
ORDER BY occurrences DESC;

-- Commentaires pour documentation
COMMENT ON TABLE typescript_errors IS 'Enregistre toutes les erreurs TypeScript détectées lors de la génération de projets pour améliorer le prompt';
COMMENT ON COLUMN typescript_errors.error_code IS 'Code TypeScript de l''erreur (ex: TS2304, TS17001)';
COMMENT ON COLUMN typescript_errors.was_fixed IS 'Si l''erreur a été automatiquement corrigée par Claude';
COMMENT ON COLUMN typescript_errors.detection_time_ms IS 'Temps pris pour valider TypeScript (tsc --noEmit)';
COMMENT ON COLUMN typescript_errors.fix_time_ms IS 'Temps pris pour corriger l''erreur (appel API Claude)';
