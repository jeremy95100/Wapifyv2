import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

/**
 * GET /api/preview/[...path]
 * Proxy pour accéder aux fichiers build stockés sur Vercel Blob Storage
 *
 * Exemple: /api/preview/proj-xxx/abc123/index.html
 * -> https://[blob-url]/proj-xxx/abc123/index.html
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path.join('/')

    if (!path) {
      return NextResponse.json({ error: 'Path is required' }, { status: 400 })
    }

    // Construire l'URL Vercel Blob
    const blobBaseUrl = process.env.BLOB_READ_WRITE_TOKEN
      ? 'https://ljs2rmlzsjqpruaa.public.blob.vercel-storage.com'
      : 'https://ljs2rmlzsjqpruaa.public.blob.vercel-storage.com'

    const blobUrl = `${blobBaseUrl}/${path}`

    console.log(`📡 Proxying preview request: ${path}`)
    console.log(`🔗 Blob URL: ${blobUrl}`)

    // Fetch depuis Blob Storage
    const response = await fetch(blobUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Wapify-Preview-Proxy'
      }
    })

    if (!response.ok) {
      console.error(`❌ Blob fetch failed: ${response.status} ${response.statusText}`)
      return NextResponse.json(
        { error: 'Failed to fetch from blob storage', status: response.status },
        { status: response.status }
      )
    }

    // Détecter le type de contenu basé sur l'extension
    const contentType = getContentType(path)

    // Récupérer le contenu
    const content = await response.arrayBuffer()

    // Retourner avec les bons headers
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
        'X-Content-Type-Options': 'nosniff'
      }
    })

  } catch (error) {
    console.error('❌ Error proxying preview request:', error)
    return NextResponse.json(
      {
        error: 'Failed to proxy preview request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Détecter le Content-Type basé sur l'extension du fichier
 */
function getContentType(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase()

  const contentTypes: Record<string, string> = {
    'html': 'text/html; charset=utf-8',
    'css': 'text/css; charset=utf-8',
    'js': 'application/javascript; charset=utf-8',
    'json': 'application/json',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'ico': 'image/x-icon',
    'woff': 'font/woff',
    'woff2': 'font/woff2',
    'ttf': 'font/ttf',
    'eot': 'application/vnd.ms-fontobject'
  }

  return contentTypes[ext || ''] || 'application/octet-stream'
}
