import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../../lib/supabase'
import { uploadProjectFiles } from '../../../../../lib/storage'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * PUT /api/projects/[id]/files
 * Update project files in Supabase Storage
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { userId, files } = body

    console.log(`📝 Updating files for project: ${id}`)
    console.log(`📁 Files to update: ${files?.length || 0}`)

    if (!userId || !files || !Array.isArray(files)) {
      return NextResponse.json(
        { error: 'userId and files array are required' },
        { status: 400 }
      )
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuration serveur manquante' },
        { status: 500 }
      )
    }

    // 1. Verify project exists and belongs to user
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (projectError || !project) {
      console.error('Project not found or unauthorized:', projectError)
      return NextResponse.json(
        { error: 'Project not found or unauthorized' },
        { status: 404 }
      )
    }

    // 2. Upload updated files to Supabase Storage
    console.log(`📤 Uploading ${files.length} files to Supabase Storage...`)
    const uploadResult = await uploadProjectFiles(userId, id, files)

    if (!uploadResult.success) {
      console.error('❌ Failed to upload files:', uploadResult.error)
      return NextResponse.json(
        { error: `Failed to upload files: ${uploadResult.error}` },
        { status: 500 }
      )
    }

    console.log(`✅ Files uploaded successfully to Supabase Storage`)

    // 3. Update the project's updated_at timestamp
    await supabaseAdmin
      .from('projects')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', id)

    // 4. Update file records in database
    const storagePath = `${userId}/${id}`

    // Delete old records
    await supabaseAdmin
      .from('project_files')
      .delete()
      .eq('project_id', id)

    // Insert new records
    const fileRecords = files.map(file => ({
      project_id: id,
      file_path: file.path,
      file_type: file.type || null,
      storage_path: `${storagePath}/${file.path}`,
      size_bytes: file.content.length
    }))

    const { error: filesError } = await supabaseAdmin
      .from('project_files')
      .insert(fileRecords)

    if (filesError) {
      console.error('⚠️ Failed to insert file records:', filesError)
      // Don't fail the request, just log the error
    } else {
      console.log(`✅ Updated ${fileRecords.length} file records in DB`)
    }

    return NextResponse.json({
      success: true,
      message: `${files.length} files updated successfully`,
      filesCount: files.length
    })

  } catch (error) {
    console.error('PUT /api/projects/[id]/files error:', error)
    return NextResponse.json(
      {
        error: 'Failed to update files',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
