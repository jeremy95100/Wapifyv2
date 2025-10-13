-- Création du bucket Storage pour les fichiers de projets

-- 1. Créer le bucket 'project-files' s'il n'existe pas
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-files', 'project-files', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Politique pour permettre aux utilisateurs de uploader leurs propres fichiers
CREATE POLICY "Users can upload their own project files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Politique pour permettre aux utilisateurs de lire leurs propres fichiers
CREATE POLICY "Users can read their own project files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'project-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Politique pour permettre aux utilisateurs de mettre à jour leurs fichiers
CREATE POLICY "Users can update their own project files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'project-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Politique pour permettre aux utilisateurs de supprimer leurs fichiers
CREATE POLICY "Users can delete their own project files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'project-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Note: Le bucket n'est PAS public, seuls les utilisateurs authentifiés peuvent accéder à leurs fichiers
