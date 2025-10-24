/**
 * Railway Deployer
 * Deploys Express API backends to Railway automatically
 * Uses Railway GraphQL API v2
 */

const RAILWAY_API_URL = 'https://backboard.railway.com/graphql/v2'
const RAILWAY_TOKEN = process.env.RAILWAY_TOKEN
const RAILWAY_PROJECT_ID = process.env.RAILWAY_PROJECT_ID

/**
 * Execute Railway GraphQL API request
 */
async function railwayGraphQL(query, variables = {}) {
  if (!RAILWAY_TOKEN) {
    throw new Error('RAILWAY_TOKEN must be set in environment variables')
  }

  const response = await fetch(RAILWAY_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RAILWAY_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query, variables })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Railway API error: ${response.status} ${error}`)
  }

  const data = await response.json()

  if (data.errors) {
    throw new Error(`Railway GraphQL error: ${JSON.stringify(data.errors)}`)
  }

  return data.data
}

/**
 * Create a Railway service from a GitHub repository
 * @param {string} repoFullName - GitHub repo full name (e.g., "wapify-app/wapify-k9jsun")
 * @param {string} serviceName - Name for the Railway service
 * @param {Object} envVars - Environment variables to set
 * @returns {Promise<{serviceId: string, serviceName: string, deploymentUrl: string}>}
 */
export async function createRailwayService(repoFullName, serviceName, envVars = {}) {
  console.log(`📦 Creating Railway service: ${serviceName}`)
  console.log(`🔗 GitHub repo: ${repoFullName}`)

  if (!RAILWAY_PROJECT_ID) {
    throw new Error('RAILWAY_PROJECT_ID must be set in environment variables')
  }

  // Step 1: Create the service
  const createServiceMutation = `
    mutation ServiceCreate($input: ServiceCreateInput!) {
      serviceCreate(input: $input) {
        id
        name
        createdAt
      }
    }
  `

  const serviceInput = {
    projectId: RAILWAY_PROJECT_ID,
    name: serviceName,
    source: {
      repo: repoFullName
    }
  }

  const serviceResult = await railwayGraphQL(createServiceMutation, {
    input: serviceInput
  })

  const serviceId = serviceResult.serviceCreate.id
  console.log(`✅ Railway service created: ${serviceId}`)

  // Step 2: Set environment variables
  if (Object.keys(envVars).length > 0) {
    console.log(`🔧 Setting ${Object.keys(envVars).length} environment variables...`)

    for (const [key, value] of Object.entries(envVars)) {
      // Skip sensitive values in logs
      const logValue = key.includes('SECRET') || key.includes('TOKEN') || key.includes('PASSWORD')
        ? '***'
        : value.substring(0, 50) + (value.length > 50 ? '...' : '')

      console.log(`  ${key}=${logValue}`)

      const setVariableMutation = `
        mutation VariableUpsert($input: VariableUpsertInput!) {
          variableUpsert(input: $input)
        }
      `

      await railwayGraphQL(setVariableMutation, {
        input: {
          projectId: RAILWAY_PROJECT_ID,
          environmentId: null, // null = production environment
          serviceId: serviceId,
          name: key,
          value: value
        }
      })
    }

    console.log(`✅ Environment variables set`)
  }

  // Step 3: Get service deployment URL (generated automatically by Railway)
  // Railway automatically assigns a URL like: service-name.railway.app
  const getServiceQuery = `
    query Service($id: String!) {
      service(id: $id) {
        id
        name
        deployments(first: 1) {
          edges {
            node {
              id
              status
              url
            }
          }
        }
      }
    }
  `

  // Wait a bit for deployment to start
  await new Promise(resolve => setTimeout(resolve, 3000))

  let deploymentUrl = null
  try {
    const serviceData = await railwayGraphQL(getServiceQuery, { id: serviceId })
    const deployment = serviceData.service.deployments.edges[0]?.node

    if (deployment?.url) {
      deploymentUrl = deployment.url
      console.log(`✅ Deployment URL: ${deploymentUrl}`)
    } else {
      // Fallback: Railway assigns predictable URLs
      const sanitizedName = serviceName.toLowerCase().replace(/[^a-z0-9-]/g, '-')
      deploymentUrl = `https://${sanitizedName}.up.railway.app`
      console.log(`⚠️  Using predicted URL: ${deploymentUrl}`)
    }
  } catch (error) {
    console.warn(`⚠️  Could not get deployment URL: ${error.message}`)
    // Fallback URL
    const sanitizedName = serviceName.toLowerCase().replace(/[^a-z0-9-]/g, '-')
    deploymentUrl = `https://${sanitizedName}.up.railway.app`
  }

  return {
    serviceId,
    serviceName,
    deploymentUrl
  }
}

/**
 * Get Railway service information
 */
export async function getRailwayService(serviceId) {
  const query = `
    query Service($id: String!) {
      service(id: $id) {
        id
        name
        createdAt
        deployments(first: 5) {
          edges {
            node {
              id
              status
              url
              createdAt
            }
          }
        }
      }
    }
  `

  const data = await railwayGraphQL(query, { id: serviceId })
  return data.service
}

/**
 * Full deployment workflow: Deploy Express API to Railway
 * @param {string} githubRepoFullName - Full GitHub repo name
 * @param {string} projectId - Wapify project ID
 * @param {string} dbConnectionString - Neon database connection string
 */
export async function deployAPIToRailway(githubRepoFullName, projectId, dbConnectionString) {
  console.log(`\n🚀 Starting Railway deployment for API...`)
  console.log(`📦 GitHub repo: ${githubRepoFullName}`)
  console.log(`🆔 Project ID: ${projectId}`)

  try {
    // Extract nanoid for service naming
    const uniqueId = projectId.split('-').pop()
    const serviceName = `wapify-api-${uniqueId}`

    // Prepare environment variables
    const envVars = {
      DATABASE_URL: dbConnectionString,
      PORT: '3001',
      NODE_ENV: 'production'
    }

    // Create Railway service
    const railwayService = await createRailwayService(
      githubRepoFullName,
      serviceName,
      envVars
    )

    console.log(`✅ Railway deployment complete`)
    console.log(`   Service: ${railwayService.serviceName}`)
    console.log(`   URL: ${railwayService.deploymentUrl}`)

    return {
      serviceId: railwayService.serviceId,
      serviceName: railwayService.serviceName,
      apiUrl: railwayService.deploymentUrl
    }

  } catch (error) {
    console.error(`❌ Railway deployment failed:`, error)
    throw error
  }
}
