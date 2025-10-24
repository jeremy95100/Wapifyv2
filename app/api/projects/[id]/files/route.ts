import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * PUT /api/projects/[id]/files
 * Update project files in Vercel Blob storage
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { userId, files } = body

    if (!userId || !files || !Array.isArray(files)) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, files' },
        { status: 400 }
      )
    }

    console.log(`💾 Saving ${files.length} files for project: ${id}`)

    // Create the files structure JSON
    const filesData = {
      files: files.map((f: any) => ({
        path: f.path,
        content: f.content,
        type: f.type || 'file'
      })),
      updatedAt: new Date().toISOString()
    }

    // Upload to Vercel Blob
    const storagePath = `${userId}/${id}/files.json`
    const blob = await put(storagePath, JSON.stringify(filesData, null, 2), {
      access: 'public',
      contentType: 'application/json'
    })

    console.log(`✅ Files saved to: ${blob.url}`)

    return NextResponse.json({
      success: true,
      url: blob.url,
      filesCount: files.length
    })

  } catch (error) {
    console.error('❌ Error saving files:', error)
    return NextResponse.json(
      {
        error: 'Failed to save files',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
