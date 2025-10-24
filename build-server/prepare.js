/**
 * Prepare script - Copy necessary files from parent directory
 * This runs before starting the server on Railway
 */
import { copyFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const reactGeneratorSource = join(__dirname, '../lib/react-generator.ts')
const reactGeneratorDest = join(__dirname, 'src/react-generator.ts')

if (existsSync(reactGeneratorSource)) {
  console.log('📦 Copying react-generator.ts...')
  copyFileSync(reactGeneratorSource, reactGeneratorDest)
  console.log('✅ react-generator copied')
} else {
  console.error('❌ react-generator.ts not found at:', reactGeneratorSource)
  process.exit(1)
}
