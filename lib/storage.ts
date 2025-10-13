/**
 * Service pour gérer le stockage de fichiers via Supabase Storage
 */

import { supabaseAdmin } from './supabase'

export interface ProjectFile {
  path: string // "src/App.jsx", "index.html", etc.
  content: string
  type?: string // "component", "hook", "style", etc.
}

/**
 * Uploader plusieurs fichiers pour un projet
 */
export async function uploadProjectFiles(
  userId: string,
  projectId: string,
  files: ProjectFile[]
): Promise<{ success: boolean; uploadedFiles?: string[]; error?: string }> {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not initialized')
    }

    console.log(`📤 Uploading ${files.length} files to Storage...`)

    const uploadedFiles: string[] = []

    for (const file of files) {
      const filePath = `${userId}/${projectId}/${file.path}`

      console.log(`📤 Uploading file: ${filePath}`)

      // Convertir le contenu en Blob
      const blob = new Blob([file.content], {
        type: inferMimeType(file.path)
      })

      // Upload vers Supabase Storage
      const { data, error } = await supabaseAdmin.storage
        .from('project-files')
        .upload(filePath, blob, {
          contentType: inferMimeType(file.path),
          upsert: true // Écraser si le fichier existe déjà
        })

      if (error) {
        console.error(`❌ Error uploading ${filePath}:`, error)
        throw error
      }

      console.log(`✅ Uploaded: ${filePath}`)
      uploadedFiles.push(filePath)
    }

    console.log(`✅ All files uploaded successfully for project ${projectId}`)
    return { success: true, uploadedFiles }
  } catch (error) {
    console.error('❌ Error uploading project files:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Récupérer tous les fichiers d'un projet depuis Storage (récursivement)
 */
export async function getProjectFiles(
  userId: string,
  projectId: string
): Promise<{ success: boolean; files?: ProjectFile[]; error?: string }> {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not initialized')
    }

    const storagePath = `${userId}/${projectId}`
    const files: ProjectFile[] = []

    // Fonction récursive pour lister tous les fichiers
    async function listFilesRecursive(path: string, currentPath: string = '') {
      const { data: items, error: listError } = await supabaseAdmin!.storage
        .from('project-files')
        .list(path, {
          limit: 1000,
          offset: 0
        })

      if (listError) {
        console.error(`❌ Error listing ${path}:`, listError)
        return
      }

      if (!items || items.length === 0) {
        return
      }

      for (const item of items) {
        if (item.name === '.emptyFolderPlaceholder') continue

        const itemPath = path === storagePath ? item.name : `${currentPath}/${item.name}`
        const fullStoragePath = `${path}/${item.name}`

        // Si c'est un dossier (metadata indique que c'est un dossier)
        if (item.id === null) {
          // Récursion dans le sous-dossier
          await listFilesRecursive(fullStoragePath, itemPath)
        } else {
          // C'est un fichier, le télécharger
          const { data: fileData, error: downloadError } = await supabaseAdmin!.storage
            .from('project-files')
            .download(fullStoragePath)

          if (downloadError) {
            console.error(`❌ Error downloading ${fullStoragePath}:`, downloadError)
            continue
          }

          const content = await fileData.text()

          files.push({
            path: itemPath,
            content,
            type: inferFileType(itemPath)
          })
        }
      }
    }

    // Lancer la recherche récursive
    await listFilesRecursive(storagePath)

    if (files.length === 0) {
      console.log(`📂 No files found in Storage for project ${projectId}`)
    } else {
      console.log(`✅ Successfully loaded ${files.length} files from Storage:`, files.map(f => f.path))
    }

    return { success: true, files }
  } catch (error) {
    console.error('❌ Error getting project files:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Supprimer tous les fichiers d'un projet
 */
export async function deleteProjectFiles(
  userId: string,
  projectId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not initialized')
    }

    const folderPath = `${userId}/${projectId}`

    // Lister tous les fichiers
    const { data: fileList, error: listError } = await supabaseAdmin.storage
      .from('project-files')
      .list(folderPath)

    if (listError) {
      throw listError
    }

    if (!fileList || fileList.length === 0) {
      return { success: true }
    }

    // Supprimer tous les fichiers
    const filePaths = fileList.map(file => `${folderPath}/${file.name}`)

    const { error: deleteError } = await supabaseAdmin.storage
      .from('project-files')
      .remove(filePaths)

    if (deleteError) {
      throw deleteError
    }

    return { success: true }
  } catch (error) {
    console.error('❌ Error deleting project files:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Obtenir l'URL publique d'un fichier (pour preview, etc.)
 */
export function getPublicUrl(
  userId: string,
  projectId: string,
  filePath: string
): string | null {
  if (!supabaseAdmin) {
    return null
  }

  const fullPath = `${userId}/${projectId}/${filePath}`

  const { data } = supabaseAdmin.storage
    .from('project-files')
    .getPublicUrl(fullPath)

  return data?.publicUrl || null
}

/**
 * Inférer le type MIME depuis l'extension du fichier
 */
function inferMimeType(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase()

  const mimeTypes: Record<string, string> = {
    'js': 'application/javascript',
    'jsx': 'application/javascript',
    'ts': 'application/typescript',
    'tsx': 'application/typescript',
    'json': 'application/json',
    'html': 'text/html',
    'css': 'text/css',
    'md': 'text/markdown',
    'txt': 'text/plain',
    'svg': 'image/svg+xml',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif'
  }

  return mimeTypes[ext || ''] || 'text/plain'
}

/**
 * Inférer le type de fichier (pour catégorisation)
 */
function inferFileType(filePath: string): string {
  if (filePath.includes('/components/')) return 'component'
  if (filePath.includes('/hooks/')) return 'hook'
  if (filePath.includes('/lib/') || filePath.includes('/utils/')) return 'utility'
  if (filePath.endsWith('.css') || filePath.includes('/styles/')) return 'style'
  if (filePath.includes('config')) return 'config'
  if (filePath.endsWith('.html')) return 'html'
  if (filePath.endsWith('.md')) return 'documentation'
  return 'other'
}
