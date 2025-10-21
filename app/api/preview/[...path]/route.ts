import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

/**
 * GET /api/preview/[projectId]/[buildId]/[...path]
 * Proxy to serve files from Vercel Blob with correct Content-Disposition
 *
 * This proxies Vercel Blob URLs because Blob forces "attachment" for HTML files,
 * preventing them from displaying in browsers. This proxy fetches the file
 * and serves it with "inline" disposition.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const pathSegments = params.path

    if (!pathSegments || pathSegments.length < 3) {
      return NextResponse.json(
        { error: 'Invalid path. Expected: /api/preview/{projectId}/{buildId}/{filename}' },
        { status: 400 }
      )
    }

    const [projectId, buildId, ...filePathParts] = pathSegments
    const filePath = filePathParts.join('/')

    // Construct Vercel Blob URL
    const blobBaseUrl = 'https://ljs2rmlzsjqpruaa.public.blob.vercel-storage.com'
    const blobUrl = `${blobBaseUrl}/${projectId}/${buildId}/${filePath}`

    console.log(`📡 Proxying: ${blobUrl}`)

    // Fetch from Vercel Blob
    const response = await fetch(blobUrl, {
      headers: {
        // Forward relevant headers from original request
        'User-Agent': request.headers.get('user-agent') || 'Wapify-Proxy'
      }
    })

    if (!response.ok) {
      console.error(`❌ Blob fetch failed: ${response.status} ${response.statusText}`)
      return NextResponse.json(
        { error: `Failed to fetch file: ${response.statusText}` },
        { status: response.status }
      )
    }

    // Get content
    const content = await response.arrayBuffer()

    // Determine Content-Type from original response
    const contentType = response.headers.get('content-type') || 'application/octet-stream'

    // Create response with proper headers
    const proxyResponse = new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': 'inline', // FORCE inline instead of attachment
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
        'X-Proxied-From': 'Vercel-Blob'
      }
    })

    return proxyResponse

  } catch (error) {
    console.error('❌ Proxy error:', error)
    return NextResponse.json(
      {
        error: 'Failed to proxy file',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
