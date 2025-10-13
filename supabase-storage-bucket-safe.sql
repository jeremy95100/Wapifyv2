-- Configuration SÉCURISÉE du bucket Storage pour les fichiers de projets
-- Cette version utilise DROP IF EXISTS pour éviter les erreurs

-- 1. Créer le bucket 'project-files' s'il n'existe pas
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-files', 'project-files', false)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public;

-- 2. SUPPRIMER les anciennes policies si elles existent
DROP POLICY IF EXISTS "Users can upload their own project files" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own project files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own project files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own project files" ON storage.objects;

-- 3. Politique pour permettre aux utilisateurs de uploader leurs propres fichiers
CREATE POLICY "Users can upload their own project files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Politique pour permettre aux utilisateurs de lire leurs propres fichiers
CREATE POLICY "Users can read their own project files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'project-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Politique pour permettre aux utilisateurs de mettre à jour leurs fichiers
CREATE POLICY "Users can update their own project files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'project-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 6. Politique pour permettre aux utilisateurs de supprimer leurs fichiers
CREATE POLICY "Users can delete their own project files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'project-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Afficher un résumé
DO $$
BEGIN
  RAISE NOTICE '✅ Bucket Storage configuré avec succès!';
  RAISE NOTICE '🪣 Bucket: project-files (privé)';
  RAISE NOTICE '🔒 Policies RLS: Les utilisateurs peuvent uniquement accéder à leurs propres fichiers';
  RAISE NOTICE '📁 Structure: {userId}/{projectId}/{filePath}';
END $$;

-- Note: Le bucket n'est PAS public, seuls les utilisateurs authentifiés peuvent accéder à leurs fichiers
