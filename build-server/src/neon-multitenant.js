/**
 * Neon Database Management - Multitenant Architecture
 *
 * New architecture: 1 shared Neon database for ALL projects
 * Data isolation via project_id column
 */

const NEON_API_KEY = process.env.NEON_API_KEY
const NEON_API_BASE = 'https://console.neon.tech/api/v2'

// Shared database configuration
const SHARED_NEON_PROJECT_ID = process.env.SHARED_NEON_PROJECT_ID
const SHARED_DATABASE_URL = process.env.SHARED_DATABASE_URL

if (!SHARED_NEON_PROJECT_ID) {
  console.warn('⚠️  SHARED_NEON_PROJECT_ID not set - multitenant features disabled')
}

if (!SHARED_DATABASE_URL) {
  console.warn('⚠️  SHARED_DATABASE_URL not set - multitenant features disabled')
}

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
 * Generate SQL CREATE TABLE from JSON schema (with project_id)
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
        const defaultValue = col.default.trim()

        // Skip column references
        const isColumnReference = /^[a-z_]+$/.test(defaultValue) &&
          !['true', 'false', 'null', 'current_timestamp', 'now()'].includes(defaultValue.toLowerCase())

        if (!isColumnReference) {
          const needsQuotes =
            !defaultValue.match(/^'.*'$/) && // Already quoted
            !defaultValue.match(/^\d+(\.\d+)?$/) && // Number
            !defaultValue.match(/^(true|false|null)$/i) && // Boolean/null
            !defaultValue.match(/^(now|current_timestamp|gen_random_uuid)\(\)$/i) // Functions

          if (needsQuotes) {
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

    // Create index on project_id for performance
    const indexSQL = `CREATE INDEX IF NOT EXISTS "idx_${table.name}_project_id" ON "${table.name}"(project_id);`
    sqlStatements.push(indexSQL)
  }

  // Add foreign keys
  for (const table of schema.tables) {
    for (const col of table.columns) {
      if (col.references) {
        const [refTable, refColumn] = col.references.split('.')
        const alterSQL = `ALTER TABLE "${table.name}" ADD CONSTRAINT IF NOT EXISTS "fk_${table.name}_${col.name}" FOREIGN KEY ("${col.name}") REFERENCES "${refTable}"("${refColumn}") ON DELETE CASCADE;`
        sqlStatements.push(alterSQL)
      }
    }
  }

  return sqlStatements.join('\n\n')
}

/**
 * Create tables in shared Neon database
 *
 * @param {string} projectId - Wapify project ID (e.g., "proj-k9jsun")
 * @param {Object} databaseSchema - Schema with tables and columns
 * @returns {Promise<{projectId: string, connectionString: string, tablesCreated: string[]}>}
 */
export async function createTablesInSharedDatabase(projectId, databaseSchema) {
  console.log(`\n📦 Creating tables in shared database for project ${projectId}...`)

  if (!SHARED_DATABASE_URL) {
    throw new Error('SHARED_DATABASE_URL not configured')
  }

  // Import pg dynamically
  const pg = await import('pg')
  const { Client } = pg.default

  const client = new Client({
    connectionString: SHARED_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })

  try {
    await client.connect()
    console.log('✅ Connected to shared database')

    // Register project in projects table
    await registerProject(client, projectId)

    // Generate and execute CREATE TABLE statements
    const sql = generateCreateTableSQL(databaseSchema)
    console.log('📝 Generated SQL:')
    console.log(sql)

    await client.query(sql)

    const tableNames = databaseSchema.tables.map(t => t.name)
    console.log(`✅ Tables created: ${tableNames.join(', ')}`)

    return {
      projectId,
      connectionString: SHARED_DATABASE_URL,
      tablesCreated: tableNames,
      isShared: true
    }

  } catch (error) {
    console.error('❌ Failed to create tables:', error)
    throw error
  } finally {
    await client.end()
  }
}

/**
 * Register project in projects table
 */
async function registerProject(client, projectId) {
  console.log(`📝 Registering project ${projectId}...`)

  // Create projects table if not exists
  await client.query(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
  `)

  // Insert or update project
  await client.query(`
    INSERT INTO projects (id, created_at, updated_at)
    VALUES ($1, now(), now())
    ON CONFLICT (id) DO UPDATE SET updated_at = now();
  `, [projectId])

  console.log(`✅ Project ${projectId} registered`)
}

/**
 * Get shared database connection string
 * (same for all projects - isolation via project_id)
 */
export function getSharedDatabaseConnectionString() {
  return SHARED_DATABASE_URL
}

/**
 * Check if shared database is configured
 */
export function isSharedDatabaseConfigured() {
  return Boolean(SHARED_DATABASE_URL && SHARED_NEON_PROJECT_ID)
}

/**
 * Migrate: Copy data from old branch to shared database
 * (For migrating existing apps to new architecture)
 */
export async function migrateFromBranchToShared(oldBranchConnectionString, projectId, schema) {
  console.log(`\n🔄 Migrating project ${projectId} to shared database...`)

  const pg = await import('pg')
  const { Client } = pg.default

  const oldClient = new Client({
    connectionString: oldBranchConnectionString,
    ssl: { rejectUnauthorized: false }
  })

  const newClient = new Client({
    connectionString: SHARED_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })

  try {
    await oldClient.connect()
    await newClient.connect()

    console.log('✅ Connected to both databases')

    // For each table, copy data and add project_id
    for (const table of schema.tables) {
      console.log(`📦 Migrating table: ${table.name}`)

      // Get all rows from old database
      const result = await oldClient.query(`SELECT * FROM "${table.name}"`)
      const rows = result.rows

      if (rows.length === 0) {
        console.log(`  ⚠️  No data to migrate`)
        continue
      }

      // Insert into new database with project_id
      for (const row of rows) {
        row.project_id = projectId

        const columns = Object.keys(row)
        const values = Object.values(row)
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ')

        await newClient.query(
          `INSERT INTO "${table.name}" (${columns.join(', ')}) VALUES (${placeholders})`,
          values
        )
      }

      console.log(`  ✅ Migrated ${rows.length} rows`)
    }

    console.log(`✅ Migration complete for project ${projectId}`)

  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await oldClient.end()
    await newClient.end()
  }
}
