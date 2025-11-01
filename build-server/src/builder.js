import fs from 'fs-extra'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import { put } from '@vercel/blob'
import { nanoid } from 'nanoid'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const execAsync = promisify(exec)

// Initialize Anthropic for error correction
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

// Initialize Supabase for logging TypeScript errors
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Temporary build directory
const BUILDS_DIR = path.join(process.cwd(), 'builds')

/**
 * Parse TypeScript errors from tsc output
 * Format: src/pages/Home.tsx(42,5): error TS2305: Module '"lucide-react"' has no exported member 'Stop'.
 */
function parseTypeScriptErrors(output) {
  const errors = []
  const lines = output.split('\n')
  const errorRegex = /^(.+?)\((\d+),(\d+)\):\s+error\s+(TS\d+):\s+(.+)$/

  for (const line of lines) {
    const match = line.match(errorRegex)
    if (match) {
      errors.push({
        file: match[1],
        line: parseInt(match[2]),
        column: parseInt(match[3]),
        code: match[4],
        message: match[5]
      })
    }
  }

  return errors
}

/**
 * Save TypeScript errors to database for analysis
 */
async function saveErrorsToDatabase(projectId, jobId, errors, userPrompt, buildDir) {
  if (!errors || errors.length === 0) return

  try {
    const errorsToInsert = await Promise.all(errors.map(async (error) => {
      // Read file content before fix
      let fileContentBefore = null
      try {
        const filePath = path.join(buildDir, error.file)
        fileContentBefore = await fs.readFile(filePath, 'utf-8')
      } catch (e) {
        console.warn(`⚠️  Could not read file for error logging: ${error.file}`)
      }

      return {
        project_id: projectId,
        job_id: jobId,
        error_code: error.code,
        error_message: error.message,
        file_path: error.file,
        line_number: error.line,
        column_number: error.column,
        user_prompt: userPrompt,
        file_content_before: fileContentBefore,
        was_fixed: false // Will be updated after fix attempt
      }
    }))

    const { data, error } = await supabase
      .from('typescript_errors')
      .insert(errorsToInsert)
      .select('id')

    if (error) {
      console.error('❌ Error saving to database:', error.message)
    } else {
      console.log(`📊 Saved ${errorsToInsert.length} error(s) to database`)
      return data // Return inserted records with IDs
    }
  } catch (err) {
    console.error('❌ Exception saving errors to database:', err.message)
  }

  return null
}

/**
 * Update error records after fix attempt
 */
async function updateErrorsAfterFix(errorIds, buildDir, errors, fixSuccess) {
  if (!errorIds || errorIds.length === 0) return

  try {
    // Read file contents after fix
    const filesToUpdate = new Set(errors.map(e => e.file))
    const fileContentsAfter = {}

    for (const file of filesToUpdate) {
      try {
        const filePath = path.join(buildDir, file)
        fileContentsAfter[file] = await fs.readFile(filePath, 'utf-8')
      } catch (e) {
        console.warn(`⚠️  Could not read file after fix: ${file}`)
      }
    }

    // Update each error record
    for (let i = 0; i < errorIds.length; i++) {
      const errorId = errorIds[i].id
      const error = errors[i]
      const fileContentAfter = fileContentsAfter[error.file]

      await supabase
        .from('typescript_errors')
        .update({
          was_fixed: fixSuccess,
          fix_applied_at: new Date().toISOString(),
          file_content_after: fileContentAfter
        })
        .eq('id', errorId)
    }

    console.log(`📊 Updated ${errorIds.length} error record(s) in database`)
  } catch (err) {
    console.error('❌ Exception updating errors in database:', err.message)
  }
}

/**
 * Fix TypeScript errors using Claude agent
 * Phase 2: Automatic error correction
 */
async function fixTypeScriptErrorsWithClaude(buildDir, errors) {
  console.log(`\n🤖 Calling Claude agent to fix ${errors.length} error(s)...`)

  try {
    // Read files with errors
    const filesToFix = new Set(errors.map(e => e.file))
    const fileContents = {}

    for (const file of filesToFix) {
      const filePath = path.join(buildDir, file)
      fileContents[file] = await fs.readFile(filePath, 'utf-8')
    }

    // Prepare prompt for Claude
    const errorsDescription = errors.slice(0, 10).map((err, i) =>
      `${i + 1}. ${err.file}:${err.line}:${err.column}\n   ${err.code}: ${err.message}`
    ).join('\n\n')

    const filesDescription = Object.entries(fileContents).map(([file, content]) =>
      `=== ${file} ===\n${content}`
    ).join('\n\n')

    const prompt = `Tu es un expert TypeScript. Tu dois corriger UNIQUEMENT les erreurs listées ci-dessous.

ERREURS À CORRIGER :
${errorsDescription}

FICHIERS CONCERNÉS :
${filesDescription}

RÈGLES STRICTES :
1. Corrige UNIQUEMENT les erreurs listées (ne modifie rien d'autre)
2. Garde exactement la même structure et logique
3. Pour TS17001 (attributs en double) : supprime le doublon
4. Pour TS2322 (type mismatch) : corrige le type (ex: number → string pour input.value)
5. Pour TS2305 (import manquant) : ajoute l'import correct
6. Pour TS2300 (duplicate identifier) : supprime ou renomme le doublon

Retourne UNIQUEMENT le JSON suivant (pas de markdown, pas d'explication) :
{
  "fixes": [
    {
      "file": "chemin/fichier.tsx",
      "newContent": "contenu complet du fichier corrigé"
    }
  ]
}`

    // Call Claude
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 16000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })

    const response = message.content[0].text

    // Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*"fixes"[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('❌ Claude response is not valid JSON')
      return false
    }

    const result = JSON.parse(jsonMatch[0])

    // Apply fixes
    if (result.fixes && result.fixes.length > 0) {
      console.log(`✅ Claude generated ${result.fixes.length} fix(es)`)

      for (const fix of result.fixes) {
        const filePath = path.join(buildDir, fix.file)
        await fs.writeFile(filePath, fix.newContent, 'utf-8')
        console.log(`   ✓ Fixed ${fix.file}`)
      }

      return true
    }

    return false

  } catch (error) {
    console.error('❌ Error calling Claude for fixes:', error.message)
    return false
  }
}

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
export async function buildProject({ projectId, files, projectName, jobId, userPrompt, onProgress }) {
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

    // 4. TypeScript Validation (tsc --noEmit)
    console.log(`🔍 Validating TypeScript...`)
    const validationStart = Date.now()

    try {
      const { stdout: tscOutput, stderr: tscError } = await execAsync('npx tsc --noEmit --skipLibCheck 2>&1', {
        cwd: buildDir,
        timeout: 60000, // 1 minute max
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer
      })

      const validationTime = Date.now() - validationStart
      console.log(`✅ TypeScript validation passed in ${(validationTime / 1000).toFixed(1)}s`)

    } catch (error) {
      // tsc exits with code 2 when there are type errors
      const validationTime = Date.now() - validationStart
      const output = error.stdout || error.stderr || error.message || ''

      // Parse TypeScript errors
      const errors = parseTypeScriptErrors(output)

      if (errors.length > 0) {
        console.warn(`⚠️  ${errors.length} TypeScript error(s) detected:`)
        errors.slice(0, 10).forEach((err, i) => {
          console.log(`\n${i + 1}. ${err.file}:${err.line}`)
          console.log(`   ${err.code}: ${err.message}`)
        })

        if (errors.length > 10) {
          console.log(`\n... and ${errors.length - 10} more error(s)`)
        }

        console.log(`⏱️  Validation took ${(validationTime / 1000).toFixed(1)}s`)

        // Save errors to database for analysis
        const errorRecords = await saveErrorsToDatabase(projectId, jobId, errors, userPrompt, buildDir)

        // Phase 2: Automatic error correction with Claude agent
        const fixStart = Date.now()
        const fixSuccess = await fixTypeScriptErrorsWithClaude(buildDir, errors)
        const fixTime = Date.now() - fixStart

        // Update error records with fix results
        if (errorRecords) {
          await updateErrorsAfterFix(errorRecords, buildDir, errors, fixSuccess)
        }

        if (fixSuccess) {
          // Re-validate after fixes
          console.log('\n🔍 Re-validating TypeScript after fixes...')
          const recheckStart = Date.now()

          try {
            await execAsync('npx tsc --noEmit --skipLibCheck 2>&1', {
              cwd: buildDir,
              timeout: 60000,
              maxBuffer: 10 * 1024 * 1024
            })

            const recheckTime = Date.now() - recheckStart
            console.log(`✅ Re-validation passed! All errors fixed in ${(recheckTime / 1000).toFixed(1)}s`)
          } catch (recheckError) {
            const recheckOutput = recheckError.stdout || recheckError.stderr || ''
            const remainingErrors = parseTypeScriptErrors(recheckOutput)

            if (remainingErrors.length > 0) {
              console.warn(`⚠️  ${remainingErrors.length} error(s) still remain after fixes`)
              remainingErrors.slice(0, 5).forEach((err, i) => {
                console.log(`\n${i + 1}. ${err.file}:${err.line}`)
                console.log(`   ${err.code}: ${err.message}`)
              })
            }
          }
        } else {
          console.warn('⚠️  Claude agent could not fix errors, continuing with build...')
        }
      }
    }

    // 5. Build with Vite
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
