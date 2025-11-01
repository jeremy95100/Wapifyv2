/**
 * GitHub Deployer
 * Creates GitHub repositories and pushes generated code
 */

const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const GITHUB_ORG = process.env.GITHUB_ORG || 'wapify-app' // Organization or username
const GITHUB_API_BASE = 'https://api.github.com'

/**
 * Execute GitHub API request
 */
async function githubAPI(endpoint, method = 'GET', body = null) {
  const url = `${GITHUB_API_BASE}${endpoint}`

  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    }
  }

  if (body) {
    options.headers['Content-Type'] = 'application/json'
    options.body = JSON.stringify(body)
  }

  const response = await fetch(url, options)

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`GitHub API error: ${response.status} ${error}`)
  }

  // Some DELETE requests return 204 No Content
  if (response.status === 204) {
    return null
  }

  return await response.json()
}

/**
 * Create a new GitHub repository
 */
export async function createGitHubRepo(repoName, description, isPrivate = false) {
  console.log(`Creating GitHub repo: ${repoName}...`)

  const body = {
    name: repoName,
    description: description || `Wapify generated project`,
    private: isPrivate,
    auto_init: true, // Creates initial commit with README
    gitignore_template: 'Node'
  }

  // Check if using organization or personal account
  const endpoint = GITHUB_ORG
    ? `/orgs/${GITHUB_ORG}/repos`
    : '/user/repos'

  const repo = await githubAPI(endpoint, 'POST', body)

  console.log(`✅ GitHub repo created: ${repo.html_url}`)

  return {
    name: repo.name,
    fullName: repo.full_name,
    htmlUrl: repo.html_url,
    cloneUrl: repo.clone_url,
    defaultBranch: repo.default_branch
  }
}

/**
 * Create or update a file in a repository
 * Uses GitHub Contents API
 */
export async function createOrUpdateFile(repoFullName, filePath, content, message, branch = 'main') {
  console.log(`Creating file: ${filePath}`)

  // Get file SHA if it exists (for updates)
  let sha = null
  try {
    const existing = await githubAPI(`/repos/${repoFullName}/contents/${filePath}?ref=${branch}`)
    sha = existing.sha
  } catch (error) {
    // File doesn't exist, that's ok
  }

  const body = {
    message,
    content: Buffer.from(content).toString('base64'),
    branch
  }

  if (sha) {
    body.sha = sha
  }

  await githubAPI(`/repos/${repoFullName}/contents/${filePath}`, 'PUT', body)
}

/**
 * Create multiple files in a repository
 * More efficient: uses Git Trees API for batch operations
 */
export async function createMultipleFiles(repoFullName, files, commitMessage, branch = 'main') {
  console.log(`Creating ${files.length} files in ${repoFullName}...`)

  // 1. Get the latest commit SHA
  const refData = await githubAPI(`/repos/${repoFullName}/git/refs/heads/${branch}`)
  const latestCommitSha = refData.object.sha

  // 2. Get the tree SHA of the latest commit
  const commitData = await githubAPI(`/repos/${repoFullName}/git/commits/${latestCommitSha}`)
  const baseTreeSha = commitData.tree.sha

  // 3. Create blobs for all files
  const tree = []
  for (const file of files) {
    const blobData = await githubAPI(`/repos/${repoFullName}/git/blobs`, 'POST', {
      content: Buffer.from(file.content).toString('base64'),
      encoding: 'base64'
    })

    tree.push({
      path: file.path,
      mode: '100644', // file mode
      type: 'blob',
      sha: blobData.sha
    })
  }

  // 4. Create a new tree
  const treeData = await githubAPI(`/repos/${repoFullName}/git/trees`, 'POST', {
    base_tree: baseTreeSha,
    tree
  })

  // 5. Create a new commit
  const newCommitData = await githubAPI(`/repos/${repoFullName}/git/commits`, 'POST', {
    message: commitMessage,
    tree: treeData.sha,
    parents: [latestCommitSha]
  })

  // 6. Update the reference
  await githubAPI(`/repos/${repoFullName}/git/refs/heads/${branch}`, 'PATCH', {
    sha: newCommitData.sha
  })

  console.log(`✅ ${files.length} files committed to ${branch}`)

  return newCommitData.sha
}

/**
 * Delete the auto-generated README.md
 */
export async function deleteInitialReadme(repoFullName, branch = 'main') {
  try {
    const readme = await githubAPI(`/repos/${repoFullName}/contents/README.md?ref=${branch}`)

    await githubAPI(`/repos/${repoFullName}/contents/README.md`, 'DELETE', {
      message: 'Remove initial README',
      sha: readme.sha,
      branch
    })

    console.log(`✅ Deleted initial README.md`)
  } catch (error) {
    console.log(`⚠️  Could not delete README.md: ${error.message}`)
  }
}

/**
 * Generate README.md for the project
 */
function generateReadme(projectName, projectId, hasDatabase) {
  return `# ${projectName}

> Generated with [Wapify](https://wapify.app) - AI-powered web app generator

## 🚀 Getting Started

### Frontend (Vite + React)

\`\`\`bash
npm install
npm run dev
\`\`\`

Visit http://localhost:5173

${hasDatabase ? `### Backend API (Express)

\`\`\`bash
cd api
npm install

# Configure your database
cp .env.example .env
# Edit .env and add your DATABASE_URL

npm start
\`\`\`

API runs on http://localhost:3001

### Environment Variables

Create \`api/.env\`:
\`\`\`
DATABASE_URL=your_postgresql_connection_string
PORT=3001
\`\`\`

The frontend will automatically connect to the API.
` : ''}

## 📦 Deployment

### Frontend
Deploy to Vercel, Netlify, or any static hosting:
\`\`\`bash
npm run build
\`\`\`

${hasDatabase ? `### Backend
Deploy to Railway, Render, or Fly.io with the \`api/\` directory.` : ''}

## 🛠️ Built With

- React + Vite
- Tailwind CSS
- shadcn/ui components${hasDatabase ? '\n- Express.js\n- PostgreSQL (Neon)' : ''}

## 📝 Project Info

- **Project ID**: ${projectId}
- **Generated**: ${new Date().toISOString()}
- **Generator**: [Wapify](https://wapify.app)

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
`
}

/**
 * Full deployment workflow: Create repo and push all files
 */
export async function deployToGitHub(projectId, projectName, files) {
  console.log(`\n📦 Starting GitHub deployment for project ${projectId}...`)

  try {
    // Check if project has database (look for api/ folder)
    const hasDatabase = files.some(f => f.path.startsWith('api/'))

    // 1. Add README.md to files
    const readmeContent = generateReadme(projectName, projectId, hasDatabase)
    const filesWithReadme = [
      { path: 'README.md', content: readmeContent },
      ...files
    ]

    // 2. Create repository
    // Extract the unique nanoid part (after last hyphen) for collision-free naming
    // Format: proj-1761346712964-k9jsun -> k9jsun
    const parts = projectId.split('-')
    const uniqueId = parts[parts.length - 1] // Get nanoid part (always unique)
    const repoName = `wapify-${uniqueId}`
    const repo = await createGitHubRepo(
      repoName,
      `Wapify: ${projectName}`,
      false // public for now
    )

    // 3. Wait a bit for repo to be ready
    await new Promise(resolve => setTimeout(resolve, 2000))

    // 4. Delete initial README
    await deleteInitialReadme(repo.fullName)

    // 5. Push all files (including our custom README)
    const commitMessage = `Initial commit: ${projectName}

Generated by Wapify
Project ID: ${projectId}

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>`

    await createMultipleFiles(repo.fullName, filesWithReadme, commitMessage)

    console.log(`✅ GitHub deployment complete`)
    console.log(`   Repo: ${repo.htmlUrl}`)

    return {
      repoName: repo.name,
      repoFullName: repo.fullName,
      repoUrl: repo.htmlUrl,
      cloneUrl: repo.cloneUrl,
      branch: repo.defaultBranch
    }

  } catch (error) {
    console.error(`❌ GitHub deployment failed:`, error)
    throw error
  }
}

/**
 * Add API environment variables to repository
 * Called after deployment workflow completes
 *
 * @param {string} repoFullName - Full repo name (org/repo)
 * @param {string} apiUrl - Shared API URL
 * @param {string} projectId - Project ID for data isolation
 * @param {string} branch - Git branch (default: main)
 */
export async function addAPIEnvironmentFile(repoFullName, apiUrl, projectId, branch = 'main') {
  console.log(`🔧 Adding API environment variables to ${repoFullName}...`)

  const envContent = `# API Configuration
# Auto-generated after deployment
# These variables enable the frontend to connect to the shared API

# Shared API URL (same for all apps)
VITE_API_URL=${apiUrl}

# Project ID (unique per app - used for data isolation)
VITE_PROJECT_ID=${projectId}
`

  await createOrUpdateFile(
    repoFullName,
    '.env.production',
    envContent,
    'Add API environment variables (URL + PROJECT_ID)',
    branch
  )

  console.log(`✅ API environment variables added:`)
  console.log(`   VITE_API_URL=${apiUrl}`)
  console.log(`   VITE_PROJECT_ID=${projectId}`)
}

/**
 * Get repository information
 */
export async function getRepoInfo(repoFullName) {
  const repo = await githubAPI(`/repos/${repoFullName}`)

  return {
    name: repo.name,
    fullName: repo.full_name,
    htmlUrl: repo.html_url,
    cloneUrl: repo.clone_url,
    defaultBranch: repo.default_branch,
    createdAt: repo.created_at,
    updatedAt: repo.updated_at
  }
}
