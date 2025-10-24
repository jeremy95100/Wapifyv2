/**
 * Railway API Deployer
 * Creates and deploys Express API services on Railway
 */

const RAILWAY_API_KEY = process.env.RAILWAY_API_KEY
const RAILWAY_GRAPHQL_ENDPOINT = 'https://backboard.railway.app/graphql/v2'

/**
 * Execute GraphQL mutation on Railway API
 */
async function railwayGraphQL(query, variables = {}) {
  const response = await fetch(RAILWAY_GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RAILWAY_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query, variables })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Railway GraphQL error: ${response.status} ${error}`)
  }

  const data = await response.json()

  if (data.errors) {
    throw new Error(`Railway GraphQL errors: ${JSON.stringify(data.errors)}`)
  }

  return data.data
}

/**
 * Create a new Railway project
 */
export async function createRailwayProject(projectName) {
  console.log(`Creating Railway project: ${projectName}...`)

  const query = `
    mutation CreateProject($name: String!) {
      projectCreate(input: { name: $name }) {
        id
        name
      }
    }
  `

  const data = await railwayGraphQL(query, { name: projectName })
  const projectId = data.projectCreate.id

  console.log(`✅ Railway project created: ${projectId}`)
  return projectId
}

/**
 * Create a service in a Railway project
 */
export async function createRailwayService(projectId, serviceName) {
  console.log(`Creating Railway service: ${serviceName}...`)

  const query = `
    mutation CreateService($projectId: String!, $name: String!) {
      serviceCreate(input: { projectId: $projectId, name: $name }) {
        id
        name
      }
    }
  `

  const data = await railwayGraphQL(query, {
    projectId,
    name: serviceName
  })

  const serviceId = data.serviceCreate.id

  console.log(`✅ Railway service created: ${serviceId}`)
  return serviceId
}

/**
 * Set environment variables for a service
 */
export async function setRailwayEnvVars(serviceId, environmentId, variables) {
  console.log(`Setting environment variables for service ${serviceId}...`)

  const mutations = Object.entries(variables).map(([key, value], index) => {
    return `
      var${index}: variableUpsert(input: {
        serviceId: "${serviceId}",
        environmentId: "${environmentId}",
        name: "${key}",
        value: "${value}"
      })
    `
  }).join('\n')

  const query = `
    mutation SetEnvVars {
      ${mutations}
    }
  `

  await railwayGraphQL(query)
  console.log(`✅ Environment variables set`)
}

/**
 * Get the production environment ID for a project
 */
export async function getProductionEnvironmentId(projectId) {
  const query = `
    query GetEnvironments($projectId: String!) {
      project(id: $projectId) {
        environments {
          edges {
            node {
              id
              name
            }
          }
        }
      }
    }
  `

  const data = await railwayGraphQL(query, { projectId })
  const environments = data.project.environments.edges

  const production = environments.find(e => e.node.name === 'production')

  if (!production) {
    throw new Error('Production environment not found')
  }

  return production.node.id
}

/**
 * Deploy API code to Railway
 * This uses Railway's GitHub integration or source upload
 * For now, we'll use a simpler approach: deploy from a Git repo
 */
export async function deployToRailway(serviceId, environmentId, apiFiles) {
  console.log(`Deploying API to Railway service ${serviceId}...`)

  // Railway déploie automatiquement depuis un repo Git
  // Pour déployer du code généré, on doit :
  // 1. Créer un repo temporaire OU
  // 2. Utiliser Railway CLI OU
  // 3. Upload direct via API (plus complexe)

  // Pour l'instant, on va retourner l'info qu'il faut déployer manuellement
  // ou via GitHub integration

  console.log(`⚠️  Note: Railway deployment requires GitHub integration or CLI`)
  console.log(`   Files to deploy:`)
  apiFiles.forEach(file => console.log(`   - ${file.path}`))

  return {
    status: 'pending_deployment',
    message: 'Service created, awaiting deployment'
  }
}

/**
 * Get public URL for a Railway service
 */
export async function getRailwayServiceURL(serviceId, environmentId) {
  const query = `
    query GetServiceDomain($serviceId: String!, $environmentId: String!) {
      serviceDomains(serviceId: $serviceId, environmentId: $environmentId) {
        serviceDomains {
          domain
        }
      }
    }
  `

  const data = await railwayGraphQL(query, { serviceId, environmentId })

  if (data.serviceDomains.serviceDomains.length === 0) {
    throw new Error('No domain found for service')
  }

  const domain = data.serviceDomains.serviceDomains[0].domain
  return `https://${domain}`
}

/**
 * Full deployment workflow
 */
export async function deployAPIToRailway(projectName, databaseUrl, apiFiles) {
  console.log(`\n🚂 Starting Railway deployment for ${projectName}...`)

  try {
    // 1. Create project
    const projectId = await createRailwayProject(projectName)

    // 2. Get production environment
    const environmentId = await getProductionEnvironmentId(projectId)

    // 3. Create service
    const serviceId = await createRailwayService(projectId, 'api')

    // 4. Set environment variables
    await setRailwayEnvVars(serviceId, environmentId, {
      DATABASE_URL: databaseUrl,
      PORT: '3001',
      NODE_ENV: 'production'
    })

    // 5. Deploy code (pour l'instant, retourne juste les infos)
    const deploymentInfo = await deployToRailway(serviceId, environmentId, apiFiles)

    console.log(`✅ Railway setup complete`)
    console.log(`   Project ID: ${projectId}`)
    console.log(`   Service ID: ${serviceId}`)

    return {
      projectId,
      serviceId,
      environmentId,
      deploymentInfo,
      // URL sera disponible après le premier déploiement
      url: null
    }

  } catch (error) {
    console.error(`❌ Railway deployment failed:`, error)
    throw error
  }
}
