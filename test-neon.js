/**
 * Script de test simple pour Neon
 * Usage: node test-neon.js
 */

require('dotenv').config({ path: '.env.local' })

async function testNeon() {
  console.log('🧪 Test Neon - Création et suppression d\'une DB de test\n')

  const apiKey = process.env.NEON_API_KEY
  const orgId = process.env.NEON_ORG_ID

  if (!apiKey || !orgId) {
    console.error('❌ Variables manquantes dans .env.local')
    process.exit(1)
  }

  try {
    // 1. Créer un projet de test
    console.log('1️⃣  Création d\'un projet Neon de test...')
    const createRes = await fetch('https://console.neon.tech/api/v2/projects', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        project: {
          org_id: orgId,
          name: `wapify-test-${Date.now()}`,
          region_id: 'aws-us-east-2'
        }
      })
    })

    if (!createRes.ok) {
      const error = await createRes.text()
      throw new Error(`Erreur création (${createRes.status}): ${error}`)
    }

    const data = await createRes.json()
    const projectId = data.project.id
    const connectionUri = data.connection_uris[0].connection_uri

    console.log('✅ Projet créé:', projectId)
    console.log('🔗 Connection URI:', connectionUri.substring(0, 50) + '...')

    // 2. Tester une requête SQL
    console.log('\n2️⃣  Test de connexion SQL...')
    const { Client } = require('pg')
    const client = new Client({
      connectionString: connectionUri,
      ssl: { rejectUnauthorized: false }
    })

    await client.connect()
    const result = await client.query('SELECT version()')
    console.log('✅ PostgreSQL version:', result.rows[0].version.substring(0, 60) + '...')
    await client.end()

    // 3. Supprimer le projet
    console.log('\n3️⃣  Suppression du projet de test...')
    const deleteRes = await fetch(`https://console.neon.tech/api/v2/projects/${projectId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      }
    })

    if (!deleteRes.ok) {
      throw new Error(`Erreur suppression: ${deleteRes.status}`)
    }

    console.log('✅ Projet supprimé\n')
    console.log('🎉 SUCCÈS! Neon fonctionne parfaitement!')

  } catch (error) {
    console.error('\n❌ ERREUR:', error.message)
    process.exit(1)
  }
}

testNeon()
