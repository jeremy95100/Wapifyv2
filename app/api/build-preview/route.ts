import { NextRequest, NextResponse } from 'next/server'

interface BuildRequest {
  files: Array<{ path: string; content: string }>
  projectId: string
}

// Cache simple en mémoire
const buildCache = new Map<string, { html: string; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export async function POST(request: NextRequest) {
  try {
    const { files, projectId } = await request.json() as BuildRequest

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      )
    }

    // Vérifier le cache
    const cacheKey = projectId + '-' + JSON.stringify(files.map(f => f.path + f.content.length))
    const cached = buildCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('✅ Using cached build for project:', projectId)
      return NextResponse.json({ html: cached.html })
    }

    console.log('🔨 Building React project:', projectId, 'with', files.length, 'files')

    // Trouver les fichiers principaux
    const appFile = files.find(f => f.path === 'src/App.jsx' || f.path === 'App.jsx')
    const mainFile = files.find(f => f.path === 'src/main.jsx' || f.path === 'main.jsx' || f.path === 'src/index.jsx' || f.path === 'index.jsx')

    if (!appFile) {
      throw new Error('No App.jsx found')
    }

    // Extraire tous les composants (en excluant les fichiers de config)
    const componentFiles = files.filter(f =>
      (f.path.endsWith('.jsx') || f.path.endsWith('.js')) &&
      f.path !== 'src/main.jsx' &&
      f.path !== 'main.jsx' &&
      f.path !== 'src/index.jsx' &&
      f.path !== 'index.jsx' &&
      !f.path.includes('config') &&
      !f.path.includes('tailwind') &&
      !f.path.includes('postcss') &&
      !f.path.includes('vite') &&
      !f.path.includes('eslint') &&
      !f.path.includes('package')
    )

    // Extraire le CSS (enlever les directives Tailwind non compilées)
    const cssFiles = files.filter(f => f.path.endsWith('.css'))
    let allCss = cssFiles.map(f => {
      return f.content
        .replace(/@tailwind\s+[^;]+;/g, '') // Enlever @tailwind
        .replace(/@layer\s+[^{]+\{[\s\S]*?\}/g, '') // Enlever @layer
        .replace(/@apply\s+[^;]+;/g, '') // Enlever @apply
        .replace(/\/\*[\s\S]*?\*\//g, '') // Enlever commentaires
        .trim()
    }).join('\n')

    // Transformer le code JSX de tous les composants
    let allComponentsCode = ''

    for (const file of componentFiles) {
      let code = file.content
        // Enlever les imports
        .replace(/import\s+.*?from\s+['"].*?['"];?\n?/g, '')
        // Enlever les export
        .replace(/export\s+default\s+/g, '')
        .replace(/export\s+\{[^}]+\}/g, '')
        .replace(/export\s+const\s+/g, 'const ')
        .replace(/export\s+function\s+/g, 'function ')
        // Enlever CommonJS exports
        .replace(/module\.exports\s*=\s*[^;]+;?/g, '')
        .replace(/exports\.\w+\s*=\s*[^;]+;?/g, '')
        .trim()

      allComponentsCode += `\n// ${file.path}\n${code}\n`
    }

    // Créer le HTML final avec React CDN + Babel + Tailwind CDN
    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview React</title>

  <!-- Tailwind CSS via CDN -->
  <script src="https://cdn.tailwindcss.com"></script>

  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; }
    ${allCss}
  </style>

  <!-- React + ReactDOM + Babel -->
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head>
<body>
  <div id="root"></div>

  <script type="text/babel">
    const { useState, useEffect, useCallback, useMemo, useRef } = React;

    ${allComponentsCode}

    // Render
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<App />);
  </script>
</body>
</html>`

    // Mettre en cache
    buildCache.set(cacheKey, { html, timestamp: Date.now() })

    console.log('✅ Build completed successfully for project:', projectId)

    return NextResponse.json({ html })

  } catch (error) {
    console.error('❌ Build error:', error)
    return NextResponse.json(
      {
        error: 'Build failed',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
