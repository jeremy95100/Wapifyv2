import fs from 'fs-extra'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import { put } from '@vercel/blob'
import { nanoid } from 'nanoid'

const execAsync = promisify(exec)

// Temporary build directory
const BUILDS_DIR = path.join(process.cwd(), 'builds')

/**
 * Get the correct Content-Type for a file based on its extension
 */
function getContentType(filename) {
  const ext = path.extname(filename).toLowerCase()
  const types = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.mjs': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.txt': 'text/plain; charset=utf-8',
    '.xml': 'application/xml; charset=utf-8'
  }
  return types[ext] || 'application/octet-stream'
}

/**
 * Build a React project with Vite
 */
export async function buildProject({ projectId, files, projectName, onProgress }) {
  const buildId = nanoid(10)
  const buildDir = path.join(BUILDS_DIR, buildId)

  try {
    // 1. Create build directory
    console.log(`📁 Creating build directory: ${buildDir}`)
    await fs.ensureDir(buildDir)
    await onProgress?.(20)

    // 2. Write all files
    console.log(`📝 Writing ${files.length} files...`)
    for (const file of files) {
      const filePath = path.join(buildDir, file.path)
      await fs.ensureDir(path.dirname(filePath))
      await fs.writeFile(filePath, file.content, 'utf-8')
    }
    await onProgress?.(30)

    // 3. Install dependencies
    console.log(`📦 Installing dependencies...`)
    const installStart = Date.now()

    try {
      const { stdout } = await execAsync('npm install --legacy-peer-deps 2>&1', {
        cwd: buildDir,
        timeout: 120000, // 2 minutes max
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer
      })

      // Log all output
      if (stdout) console.log('npm install output:', stdout)

      const installTime = Date.now() - installStart
      console.log(`✅ Dependencies installed in ${(installTime / 1000).toFixed(1)}s`)
    } catch (error) {
      console.error('❌ npm install failed - Full error:', error)

      // Log the complete error message for debugging
      const fullErrorMessage = error.message || error.stdout || error.stderr || 'Unknown error'
      console.error('Full error output:', fullErrorMessage)

      // Extract meaningful error lines (skip npm warnings but keep actual errors)
      const errorLines = fullErrorMessage
        .split('\n')
        .filter(line => {
          const trimmed = line.trim()
          if (!trimmed) return false
          if (trimmed.includes('npm warn') || trimmed.includes('npm WARN')) return false
          if (trimmed.includes('deprecated') && !trimmed.includes('error')) return false
          return true
        })

      const meaningfulError = errorLines.join('\n').trim()
      const errorToThrow = meaningfulError || `Installation failed with exit code ${error.code || 'unknown'}`

      throw new Error(`Dependency installation failed: ${errorToThrow}`)
    }

    await onProgress?.(60)

    // 4. Build with Vite
    console.log(`🔨 Building with Vite...`)
    const buildStart = Date.now()

    try {
      const { stdout } = await execAsync('npm run build 2>&1', {
        cwd: buildDir,
        timeout: 120000, // 2 minutes max
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer
      })

      // Log build output
      if (stdout) console.log('Build output:', stdout)

      const buildTime = Date.now() - buildStart
      console.log(`✅ Build completed in ${(buildTime / 1000).toFixed(1)}s`)
    } catch (error) {
      console.error('❌ Vite build failed')
      console.error('Error object:', JSON.stringify({
        message: error.message,
        code: error.code,
        stdout: error.stdout?.substring(0, 5000),
        stderr: error.stderr?.substring(0, 5000)
      }, null, 2))

      // Combine all error outputs
      const fullOutput = [
        error.message || '',
        error.stdout || '',
        error.stderr || ''
      ].join('\n')

      console.error('Combined output (first 10000 chars):', fullOutput.substring(0, 10000))

      // Extract meaningful error lines - look for actual Vite/Rollup errors
      const errorLines = fullOutput
        .split('\n')
        .filter(line => {
          const trimmed = line.trim()
          if (!trimmed) return false
          if (trimmed.includes('npm warn') || trimmed.includes('npm WARN')) return false
          if (trimmed.includes('deprecated') && !trimmed.includes('error')) return false

          // Keep lines with error indicators
          if (trimmed.includes('error') ||
              trimmed.includes('Error:') ||
              trimmed.includes('failed') ||
              trimmed.includes('✘') ||
              trimmed.includes('✗') ||
              trimmed.includes('Cannot find') ||
              trimmed.includes('Module not found') ||
              trimmed.includes('Unexpected token')) {
            return true
          }

          return false
        })

      const meaningfulError = errorLines.slice(0, 20).join('\n').trim() // Limit to first 20 error lines

      // If we have meaningful errors, use them
      const errorToThrow = meaningfulError ||
        `Build process failed with exit code ${error.code || 'unknown'}. Check Railway logs for details.`

      throw new Error(`Build failed: ${errorToThrow}`)
    }

    await onProgress?.(80)

    // 5. Upload to Vercel Blob
    console.log(`☁️ Uploading to Vercel Blob...`)
    const distDir = path.join(buildDir, 'dist')

    if (!await fs.pathExists(distDir)) {
      throw new Error('Build output directory (dist/) not found')
    }

    const uploadedFiles = await uploadDistToBlob(distDir, projectId, buildId)
    await onProgress?.(95)

    // 6. Clean up build directory
    console.log(`🧹 Cleaning up build directory...`)
    await fs.remove(buildDir)
    await onProgress?.(100)

    // 7. Return build result
    const indexUrl = uploadedFiles.find(f => f.pathname === 'index.html')?.url

    if (!indexUrl) {
      throw new Error('index.html not found in build output')
    }

    return {
      success: true,
      projectId,
      buildId,
      url: indexUrl,
      files: uploadedFiles,
      timestamp: new Date().toISOString()
    }

  } catch (error) {
    // Clean up on error
    try {
      await fs.remove(buildDir)
    } catch (cleanupError) {
      console.error('⚠️ Failed to cleanup build directory:', cleanupError)
    }

    throw error
  }
}

/**
 * Upload dist folder to Vercel Blob Storage
 */
async function uploadDistToBlob(distDir, projectId, buildId) {
  const uploadedFiles = []

  async function uploadDirectory(dir, basePath = '') {
    const entries = await fs.readdir(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      const relativePath = path.join(basePath, entry.name)

      if (entry.isDirectory()) {
        await uploadDirectory(fullPath, relativePath)
      } else {
        const content = await fs.readFile(fullPath)
        const pathname = relativePath.replace(/\\/g, '/') // Windows compat
        const contentType = getContentType(pathname)

        // Upload to Blob with correct Content-Type and inline disposition
        const blob = await put(`${projectId}/${buildId}/${pathname}`, content, {
          access: 'public',
          addRandomSuffix: false,
          contentType: contentType,
          contentDisposition: 'inline' // Display in browser instead of download
        })

        console.log(`  ✅ Uploaded: ${pathname} (${contentType})`)
        uploadedFiles.push({
          pathname,
          url: blob.url,
          size: content.length
        })
      }
    }
  }

  await uploadDirectory(distDir)

  console.log(`✅ Uploaded ${uploadedFiles.length} files to Vercel Blob`)

  return uploadedFiles
}
