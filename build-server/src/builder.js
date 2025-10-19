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
      const { stdout, stderr } = await execAsync('npm install --legacy-peer-deps 2>&1', {
        cwd: buildDir,
        timeout: 120000, // 2 minutes max
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer
      })

      // Log all output
      if (stdout) console.log('npm install output:', stdout)

      const installTime = Date.now() - installStart
      console.log(`✅ Dependencies installed in ${(installTime / 1000).toFixed(1)}s`)
    } catch (error) {
      // Only fail if exit code is not 0
      if (error.code && error.code !== 0) {
        console.error('❌ npm install failed:', error.message)

        // Extract only actual errors, not npm warnings
        const errorMessage = error.message || error.stderr || ''
        const actualError = errorMessage
          .split('\n')
          .filter(line =>
            line.trim() &&
            !line.includes('npm warn') &&
            !line.includes('npm WARN') &&
            !line.includes('deprecated')
          )
          .join('\n')
          .trim() || 'Unknown installation error'

        throw new Error(`Dependency installation failed: ${actualError}`)
      }

      // If no error code, it's just warnings - continue
      const installTime = Date.now() - installStart
      console.log(`✅ Dependencies installed in ${(installTime / 1000).toFixed(1)}s (with warnings)`)
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
      // Only fail if exit code is not 0
      if (error.code && error.code !== 0) {
        console.error('❌ Vite build failed:', error.message)

        // Extract only actual errors, not npm warnings
        const errorMessage = error.message || error.stderr || ''
        const actualError = errorMessage
          .split('\n')
          .filter(line =>
            line.trim() &&
            !line.includes('npm warn') &&
            !line.includes('npm WARN') &&
            !line.includes('deprecated')
          )
          .join('\n')
          .trim() || 'Unknown build error'

        throw new Error(`Build failed: ${actualError}`)
      }

      // If no error code, it's just warnings - continue
      const buildTime = Date.now() - buildStart
      console.log(`✅ Build completed in ${(buildTime / 1000).toFixed(1)}s (with warnings)`)
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

        // Upload to Blob
        const blob = await put(`${projectId}/${buildId}/${pathname}`, content, {
          access: 'public',
          addRandomSuffix: false
        })

        console.log(`  ✅ Uploaded: ${pathname}`)
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
