/**
 * Neon Database Management
 * Gestion des branches Neon pour isolation des projets
 * Approche: 1 projet Neon principal + 1 branche par app générée
 * Note: Uses HTTP API for SQL execution to support dynamic queries
 */

const NEON_API_KEY = process.env.NEON_API_KEY!
const NEON_PROJECT_ID = process.env.NEON_PROJECT_ID!
const NEON_API_BASE = 'https://console.neon.tech/api/v2'

interface DatabaseColumn {
  name: string
  type: string
  primaryKey?: boolean
  nullable?: boolean
  default?: string
  references?: string // format: "table.column"
}

interface DatabaseTable {
  name: string
  columns: DatabaseColumn[]
}

export interface DatabaseSchema {
  tables: DatabaseTable[]
}

/**
 * Convertit le type JSON en type PostgreSQL
 */
function mapTypeToPostgreSQL(type: string): string {
  const typeMap: Record<string, string> = {
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
export function generateCreateTableSQL(schema: DatabaseSchema): string {
  const sqlStatements: string[] = []

  // Créer les tables
  for (const table of schema.tables) {
    const columns: string[] = []

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

  // Ajouter les foreign keys (dans un second temps pour éviter les dépendances circulaires)
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
export async function createProjectBranch(projectId: string): Promise<{
  branchId: string
  connectionString: string
}> {
  console.log(`📦 Creating Neon branch for project ${projectId}...`)

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

  console.log(`✅ Neon branch created: ${branch.id}`)

  return {
    branchId: branch.id,
    connectionString
  }
}

/**
 * Crée les tables dans une branche Neon via HTTP API
 * Note: Uses Neon HTTP API instead of serverless client to support dynamic SQL
 */
export async function createTablesInBranch(
  connectionString: string,
  schema: DatabaseSchema
): Promise<void> {
  console.log(`🔨 Creating tables in Neon branch...`)

  const createSQL = generateCreateTableSQL(schema)
  const statements = createSQL.split(';').filter(s => s.trim())

  // Execute SQL via Neon HTTP API (supports dynamic SQL)
  for (const statement of statements) {
    const trimmed = statement.trim()
    if (trimmed) {
      const response = await fetch(`${NEON_API_BASE}/projects/${NEON_PROJECT_ID}/sql`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NEON_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          query: trimmed,
          params: []
        })
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Failed to execute SQL: ${response.status} ${error}`)
      }
    }
  }

  console.log(`✅ Tables created successfully`)
}

/**
 * Supprime une branche Neon (pour cleanup)
 */
export async function deleteProjectBranch(branchId: string): Promise<void> {
  console.log(`🗑️  Deleting Neon branch ${branchId}...`)

  const response = await fetch(
    `${NEON_API_BASE}/projects/${NEON_PROJECT_ID}/branches/${branchId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${NEON_API_KEY}`,
        'Accept': 'application/json'
      }
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to delete Neon branch: ${response.status} ${error}`)
  }

  console.log(`✅ Neon branch deleted`)
}

/**
 * Fonction principale : Crée une DB complète pour un projet
 */
export async function createProjectDatabase(
  projectId: string,
  schema: DatabaseSchema
): Promise<{
  branchId: string
  connectionString: string
}> {
  console.log(`\n🚀 Creating database for project ${projectId}`)

  // 1. Créer la branche
  const { branchId, connectionString } = await createProjectBranch(projectId)

  // 2. Créer les tables
  await createTablesInBranch(connectionString, schema)

  console.log(`✅ Database ready for project ${projectId}\n`)

  return { branchId, connectionString }
}
