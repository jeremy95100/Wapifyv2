/**
 * Neon Database Management for Build Server
 * Gestion des branches Neon pour isolation des projets
 */

const NEON_API_KEY = process.env.NEON_API_KEY
const NEON_PROJECT_ID = process.env.NEON_PROJECT_ID
const NEON_API_BASE = 'https://console.neon.tech/api/v2'

/**
 * Convertit le type JSON en type PostgreSQL
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
 * Génère le SQL CREATE TABLE depuis le schema JSON
 */
export function generateCreateTableSQL(schema) {
  const sqlStatements = []

  // Créer les tables
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
        columnDef += ` DEFAULT ${col.default}`
      }

      columns.push(columnDef)
    }

    const createTableSQL = `CREATE TABLE IF NOT EXISTS "${table.name}" (\n  ${columns.join(',\n  ')}\n);`
    sqlStatements.push(createTableSQL)
  }

  // Ajouter les foreign keys
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
 * Crée une branche Neon pour un projet
 */
export async function createProjectBranch(projectId) {
  console.log(`=æ Creating Neon branch for project ${projectId}...`)

  if (!NEON_API_KEY || !NEON_PROJECT_ID) {
    throw new Error('NEON_API_KEY and NEON_PROJECT_ID must be set in environment variables')
  }

  const response = await fetch(
    `${NEON_API_BASE}/projects/${NEON_PROJECT_ID}/branches`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NEON_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        branch: {
          name: `proj-${projectId}`
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

  // Construire la connection string
  const connectionString = `postgresql://${endpoint.host}/${branch.name}?sslmode=require`

  console.log(` Neon branch created: ${branch.id}`)

  return {
    branchId: branch.id,
    connectionString
  }
}

/**
 * Crée les tables dans une branche Neon en utilisant l'API SQL
 */
export async function createTablesInBranch(connectionString, schema) {
  console.log(`=( Creating tables in Neon branch...`)

  const createSQL = generateCreateTableSQL(schema)

  // Parse connection string pour obtenir les paramètres
  const url = new URL(connectionString)
  const host = url.hostname
  const database = url.pathname.slice(1) // Remove leading /

  // Exécuter le SQL via l'API Neon
  const statements = createSQL.split(';').filter(s => s.trim())

  for (const statement of statements) {
    if (statement.trim()) {
      // Utiliser l'API Neon SQL pour exécuter les requêtes
      const sqlResponse = await fetch(`${NEON_API_BASE}/projects/${NEON_PROJECT_ID}/sql`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NEON_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          query: statement.trim(),
          params: []
        })
      })

      if (!sqlResponse.ok) {
        const error = await sqlResponse.text()
        console.error(`Failed to execute SQL: ${error}`)
        throw new Error(`Failed to execute SQL: ${sqlResponse.status} ${error}`)
      }
    }
  }

  console.log(` Tables created successfully`)
}

/**
 * Fonction principale : Crée une DB complète pour un projet
 */
export async function createProjectDatabase(projectId, schema) {
  console.log(`\n=€ Creating database for project ${projectId}`)

  // 1. Créer la branche
  const { branchId, connectionString } = await createProjectBranch(projectId)

  // 2. Créer les tables
  await createTablesInBranch(connectionString, schema)

  console.log(` Database ready for project ${projectId}\n`)

  return { branchId, connectionString }
}
