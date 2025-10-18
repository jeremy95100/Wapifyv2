/**
 * Service pour gérer les bases de données Neon
 * Permet de créer une DB dédiée pour chaque projet
 */

interface NeonProject {
  id: string
  name: string
  region_id: string
  connection_uri: string
  database_host: string
  database_name: string
}

interface CreateProjectResponse {
  project: {
    id: string
    name: string
    region_id: string
    created_at: string
  }
  connection_uris: Array<{
    connection_uri: string
    connection_parameters: {
      database: string
      host: string
      password: string
      role: string
    }
  }>
}

/**
 * Créer un nouveau projet Neon avec une base de données dédiée
 */
export async function createNeonDatabase(
  projectId: string,
  projectName: string
): Promise<{ success: boolean; project?: NeonProject; error?: string }> {
  try {
    const apiKey = process.env.NEON_API_KEY
    const orgId = process.env.NEON_ORG_ID

    if (!apiKey) {
      throw new Error('NEON_API_KEY not configured')
    }

    if (!orgId) {
      throw new Error('NEON_ORG_ID not configured. Find it in Neon Console > Organization Settings')
    }

    console.log(`🔷 Creating Neon database for project: ${projectName}`)

    // Créer le projet Neon
    const response = await fetch('https://console.neon.tech/api/v2/projects', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        project: {
          org_id: orgId,
          name: `wapify-${projectId}`,
          region_id: 'aws-us-east-2' // Région AWS (peut être configuré)
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Neon API error:', errorText)
      throw new Error(`Neon API error: ${response.status} - ${errorText}`)
    }

    const data: CreateProjectResponse = await response.json()

    // Extraire les informations de connexion
    const connectionUri = data.connection_uris[0]?.connection_uri
    const connectionParams = data.connection_uris[0]?.connection_parameters

    if (!connectionUri || !connectionParams) {
      throw new Error('No connection URI returned from Neon')
    }

    const neonProject: NeonProject = {
      id: data.project.id,
      name: data.project.name,
      region_id: data.project.region_id,
      connection_uri: connectionUri,
      database_host: connectionParams.host,
      database_name: connectionParams.database
    }

    console.log(`✅ Neon database created successfully:`, {
      id: neonProject.id,
      name: neonProject.name,
      host: neonProject.database_host
    })

    return { success: true, project: neonProject }
  } catch (error) {
    console.error('❌ Error creating Neon database:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Nettoyer le SQL généré pour le rendre compatible avec Neon PostgreSQL
 */
function cleanSQLForNeon(sql: string): string {
  let cleaned = sql

  // 1. Supprimer les références au schéma "auth" de Supabase
  cleaned = cleaned.replace(/\bauth\./g, 'public.')

  // 2. Supprimer CREATE SCHEMA auth si présent
  cleaned = cleaned.replace(/CREATE\s+SCHEMA\s+(?:IF\s+NOT\s+EXISTS\s+)?auth\s*;?/gi, '')

  // 3. Supprimer les extensions Supabase spécifiques qui n'existent pas dans Neon
  cleaned = cleaned.replace(/CREATE\s+EXTENSION\s+(?:IF\s+NOT\s+EXISTS\s+)?pgjwt\s*;?/gi, '')

  // 4. Remplacer auth.users par public.users (si l'AI a créé cette table)
  cleaned = cleaned.replace(/\bauth\.users\b/g, 'public.users')

  // 5. Supprimer les politiques RLS (Row Level Security) Supabase-specific
  cleaned = cleaned.replace(/ALTER\s+TABLE\s+[\w.]+\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY\s*;?/gi, '')

  // 6. Supprimer les politiques CREATE POLICY qui référencent auth
  cleaned = cleaned.replace(/CREATE\s+POLICY\s+[\s\S]*?auth\.[\s\S]*?;/gi, '')

  // 7. Nettoyer les lignes vides multiples
  cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n')

  console.log('🧹 SQL cleaned for Neon PostgreSQL')

  return cleaned.trim()
}

/**
 * Exécuter un schéma SQL sur une base de données Neon
 */
export async function executeNeonSQL(
  connectionUri: string,
  sql: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🔷 Executing SQL on Neon database...')

    // Nettoyer le SQL pour Neon
    const cleanedSQL = cleanSQLForNeon(sql)

    console.log('📝 Original SQL length:', sql.length, 'chars')
    console.log('📝 Cleaned SQL length:', cleanedSQL.length, 'chars')

    // Utiliser node-postgres pour exécuter le SQL
    const { Client } = require('pg')
    const client = new Client({
      connectionString: connectionUri,
      ssl: { rejectUnauthorized: false }
    })

    await client.connect()

    // Exécuter le SQL nettoyé
    await client.query(cleanedSQL)

    await client.end()

    console.log('✅ SQL executed successfully on Neon')
    return { success: true }
  } catch (error) {
    console.error('❌ Error executing SQL on Neon:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Supprimer un projet Neon
 */
export async function deleteNeonDatabase(
  neonProjectId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const apiKey = process.env.NEON_API_KEY

    if (!apiKey) {
      throw new Error('NEON_API_KEY not configured')
    }

    console.log(`🔷 Deleting Neon database: ${neonProjectId}`)

    const response = await fetch(`https://console.neon.tech/api/v2/projects/${neonProjectId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Neon API error:', errorText)
      throw new Error(`Neon API error: ${response.status} - ${errorText}`)
    }

    console.log(`✅ Neon database deleted successfully: ${neonProjectId}`)
    return { success: true }
  } catch (error) {
    console.error('❌ Error deleting Neon database:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Obtenir les informations d'un projet Neon
 */
export async function getNeonProjectInfo(
  neonProjectId: string
): Promise<{ success: boolean; project?: any; error?: string }> {
  try {
    const apiKey = process.env.NEON_API_KEY

    if (!apiKey) {
      throw new Error('NEON_API_KEY not configured')
    }

    const response = await fetch(`https://console.neon.tech/api/v2/projects/${neonProjectId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Neon API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    return { success: true, project: data }
  } catch (error) {
    console.error('❌ Error getting Neon project info:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
