import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../../lib/supabase'
import { getProjectFiles } from '../../../../../lib/storage'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const BUILD_SERVER_URL = process.env.BUILD_SERVER_URL || 'http://localhost:3001'

/**
 * POST /api/projects/[id]/rebuild
 * Force rebuild of a project with fresh files from Supabase Storage
 * This endpoint ALWAYS bypasses cache and downloads the latest files
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    console.log(`🔄 Rebuild requested for project: ${id}`)

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuration serveur manquante' },
        { status: 500 }
      )
    }

    // 1. Get project from database
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', id)
      .single()

    if (projectError || !project) {
      console.error('Error fetching project:', projectError)
      return NextResponse.json(
        { error: 'Projet non trouvé' },
        { status: 404 }
      )
    }

    console.log(`📦 Project found: ${project.name} (framework: ${project.framework})`)

    // 2. Check if it's a React project with storage
    if (project.framework !== 'react') {
      return NextResponse.json(
        { error: 'Seuls les projets React peuvent être rebuildés' },
        { status: 400 }
      )
    }

    if (!project.storage_path) {
      return NextResponse.json(
        { error: 'Ce projet n\'a pas de fichiers dans le storage' },
        { status: 400 }
      )
    }

    // 3. ALWAYS download fresh files from Storage (bypass cache)
    console.log(`📂 Downloading fresh files from storage: ${project.storage_path}`)
    const filesResult = await getProjectFiles(project.user_id, id)

    if (!filesResult.success || !filesResult.files || filesResult.files.length === 0) {
      console.error(`❌ Failed to load files: ${filesResult.error}`)
      return NextResponse.json(
        { error: `Impossible de charger les fichiers: ${filesResult.error || 'Aucun fichier trouvé'}` },
        { status: 500 }
      )
    }

    const files = filesResult.files
    console.log(`✅ Loaded ${files.length} fresh files from Storage`)

    // 4. Trigger build on build-server with fresh files
    console.log(`🔨 Triggering build on build-server...`)

    const buildResponse = await fetch(`${BUILD_SERVER_URL}/api/build`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        projectId: id,
        files: files,
        projectName: project.name || 'Wapify App'
      })
    })

    if (!buildResponse.ok) {
      const error = await buildResponse.json()
      console.error('❌ Build server error:', error)
      throw new Error(error.error || 'Build server request failed')
    }

    const buildResult = await buildResponse.json()

    console.log(`✅ Build triggered successfully, jobId: ${buildResult.jobId}`)

    return NextResponse.json({
      success: true,
      jobId: buildResult.jobId,
      filesCount: files.length,
      message: 'Build démarré avec les fichiers à jour'
    })

  } catch (error) {
    console.error('POST /api/projects/[id]/rebuild error:', error)
    return NextResponse.json(
      {
        error: 'Erreur lors du rebuild',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
