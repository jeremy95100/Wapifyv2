/**
 * Neon Database Management for Build Server
 * Architecture: 1 Neon Project per User, 1 Branch per Generated App
 */

const NEON_API_KEY = process.env.NEON_API_KEY
const NEON_API_BASE = 'https://console.neon.tech/api/v2'

/**
 * Convert JSON type to PostgreSQL type
 */
function mapTypeToPostgreSQL(type) {
  const typeMap = {
    uuid: 'UUID',
    text: 'TEXT',
    integer: 'INTEGER',
    decimal: 'DECIMAL(10,2)',
    boolean: 'BOOLEAN',
    timestamp: 'TIMESTAMP WITH TIME ZONE',
    date: 'DATE',
    jsonb: 'JSONB'
  }
  return typeMap[type.toLowerCase()] || 'TEXT'
}

/**
 * Generate SQL CREATE TABLE from JSON schema
 */
export function generateCreateTableSQL(schema) {
  const sqlStatements = []

  // Create tables
  for (const table of schema.tables) {
    const columns = []

    for (const col of table.columns) {
      let columnDef = `"${col.name}" ${mapTypeToPostgreSQL(col.type)}`

      if (col.primaryKey) {
        columnDef += ' PRIMARY KEY'
      }

      if (col.nullable === false) {
        columnDef += ' NOT NULL'
      }

      if (col.default) {
        // Validate DEFAULT value - must be a literal, function call, or special keyword
        // Skip if it's a column reference (not allowed in PostgreSQL DEFAULT)
        const defaultValue = col.default.trim()

        // Skip column references like "book_id", "user_id", etc.
        const isColumnReference = /^[a-z_]+$/.test(defaultValue) && !['true', 'false', 'null', 'current_timestamp', 'now()'].includes(defaultValue.toLowerCase())

        if (!isColumnReference) {
          // Check if it's already quoted or a function/keyword
          const needsQuotes =
            !defaultValue.match(/^'.*'$/) && // Already single-quoted
            !defaultValue.match(/^\d+(\.\d+)?$/) && // Number
            !defaultValue.match(/^(true|false|null)$/i) && // Boolean/null
            !defaultValue.match(/^(now|current_timestamp|gen_random_uuid)\(\)$/i) // Functions

          if (needsQuotes) {
            // Escape single quotes and wrap in quotes
            const escaped = defaultValue.replace(/'/g, "''")
            columnDef += ` DEFAULT '${escaped}'`
          } else {
            columnDef += ` DEFAULT ${col.default}`
          }
        }
      }

      columns.push(columnDef)
    }

    const createTableSQL = `CREATE TABLE IF NOT EXISTS "${table.name}" (\n  ${columns.join(',\n  ')}\n);`
    sqlStatements.push(createTableSQL)
  }

  // Add foreign keys
  for (const table of schema.tables) {
    for (const col of table.columns) {
      if (col.references) {
        const [refTable, refColumn] = col.references.split('.')
        const alterSQL = `ALTER TABLE "${table.name}" ADD CONSTRAINT "fk_${table.name}_${col.name}" FOREIGN KEY ("${col.name}") REFERENCES "${refTable}"("${refColumn}") ON DELETE CASCADE;`
        sqlStatements.push(alterSQL)
      }
    }
  }

  return sqlStatements.join('\n\n')
}

/**
 * Create a Neon project for a user
 * Returns the project ID to be stored in user metadata
 */
export async function createUserNeonProject(userId) {
  console.log(`Creating Neon project for user ${userId}...`)

  if (!NEON_API_KEY) {
    throw new Error('NEON_API_KEY must be set in environment variables')
  }

  const response = await fetch(
    `${NEON_API_BASE}/projects`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NEON_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        project: {
          name: `wapify-user-${userId}`,
          region_id: 'aws-us-east-2'
        }
      })
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to create Neon project: ${response.status} ${error}`)
  }

  const data = await response.json()
  const project = data.project

  console.log(`Neon project created: ${project.id}`)

  return {
    projectId: project.id
  }
}

/**
 * Create a Neon branch for a project in a user's Neon project
 */
export async function createProjectBranch(userNeonProjectId, projectId) {
  console.log(`Creating Neon branch for project ${projectId} in Neon project ${userNeonProjectId}...`)

  if (!NEON_API_KEY) {
    throw new Error('NEON_API_KEY must be set in environment variables')
  }

  const response = await fetch(
    `${NEON_API_BASE}/projects/${userNeonProjectId}/branches`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NEON_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        branch: {
          // Remove "proj-" prefix if present to avoid duplication
          name: `proj-${projectId.replace(/^proj-/, '')}`
        },
        endpoints: [
          {
            type: 'read_write'
          }
        ]
      })
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to create Neon branch: ${response.status} ${error}`)
  }

  const data = await response.json()
  const branch = data.branch
  const endpoint = data.endpoints[0]

  console.log(`Neon branch created: ${branch.id}`)
  console.log(`Endpoint created: ${endpoint.id}`)

  // Get connection string with credentials via connection_uris API
  const uriResponse = await fetch(
    `${NEON_API_BASE}/projects/${userNeonProjectId}/connection_uri?branch_id=${branch.id}&endpoint_id=${endpoint.id}&database_name=neondb&role_name=neondb_owner`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${NEON_API_KEY}`,
        'Accept': 'application/json'
      }
    }
  )

  if (!uriResponse.ok) {
    const error = await uriResponse.text()
    throw new Error(`Failed to get connection URI: ${uriResponse.status} ${error}`)
  }

  const uriData = await uriResponse.json()
  const connectionString = uriData.uri

  console.log(`Connection string retrieved with credentials`)

  return {
    branchId: branch.id,
    connectionString
  }
}

/**
 * Create tables in a Neon branch using connection string directly
 * Uses @neondatabase/serverless which works in Node.js environment
 */
export async function createTablesInBranch(connectionString, schema) {
  console.log(`Creating tables in Neon branch...`)

  const createSQL = generateCreateTableSQL(schema)

  // Use node-postgres to execute SQL since we're in Node.js environment
  const { Client } = await import('pg')

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  })

  try {
    await client.connect()
    console.log('Connected to Neon database')

    // Execute SQL statements
    const statements = createSQL.split(';').filter(s => s.trim())

    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing SQL: ${statement.trim().substring(0, 100)}...`)
        await client.query(statement.trim())
      }
    }

    console.log(`Tables created successfully`)
  } catch (error) {
    console.error('Error executing SQL:', error)
    throw error
  } finally {
    await client.end()
  }
}

/**
 * Main function: Create complete DB for a project
 */
export async function createProjectDatabase(userNeonProjectId, projectId, schema) {
  console.log(`\nCreating database for project ${projectId} in user's Neon project ${userNeonProjectId}`)

  // 1. Create branch in user's Neon project
  const { branchId, connectionString } = await createProjectBranch(userNeonProjectId, projectId)

  // 2. Create tables
  await createTablesInBranch(connectionString, schema)

  console.log(`Database ready for project ${projectId}\n`)

  return { branchId, connectionString }
}
