/**
 * Liste tous les projets Neon de votre organisation
 */

require('dotenv').config({ path: '.env.local' })

async function listProjects() {
  const apiKey = process.env.NEON_API_KEY
  const orgId = process.env.NEON_ORG_ID

  const res = await fetch(`https://console.neon.tech/api/v2/projects?org_id=${orgId}`, {
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Accept': 'application/json' }
  })

  const data = await res.json()

  console.log('📊 Projets Neon dans votre organisation:\n')
  data.projects.forEach(p => {
    console.log(`  ${p.name}`)
    console.log(`    ID: ${p.id}`)
    console.log(`    Région: ${p.region_id}`)
    console.log(`    Créé le: ${new Date(p.created_at).toLocaleString('fr-FR')}`)
    console.log()
  })
  console.log(`Total: ${data.projects.length} projet(s)`)
}

listProjects()
