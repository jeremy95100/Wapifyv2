// Script de test pour l'API Wapify
// Usage: node scripts/test-api.js

const BASE_URL = 'http://localhost:3000'

async function testAPI() {
  console.log('🧪 Test de l\'API Wapify Generator')
  console.log('=================================\n')

  // Test 1: GET - Liste des options
  console.log('📋 Test 1: GET /api/generate (Liste des options)')
  console.log('---')
  try {
    const res1 = await fetch(`${BASE_URL}/api/generate`)
    const data1 = await res1.json()
    console.log('✅ Succès:', JSON.stringify(data1, null, 2))
  } catch (error) {
    console.error('❌ Erreur:', error.message)
  }
  console.log('\n')

  // Test 2: POST Simple - Landing Page HTML
  console.log('🏠 Test 2: POST /api/generate (Landing Page HTML)')
  console.log('---')
  try {
    const res2 = await fetch(`${BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'A simple landing page with hero section and CTA button',
        framework: 'html',
        style: 'modern'
      })
    })
    const data2 = await res2.json()
    console.log('✅ Succès:', data2.success)
    console.log('   Message:', data2.message)
    console.log('   Metadata:', JSON.stringify(data2.metadata, null, 2))
  } catch (error) {
    console.error('❌ Erreur:', error.message)
  }
  console.log('\n')

  // Test 3: POST avec Template - Dashboard React
  console.log('📊 Test 3: POST /api/generate (Dashboard React + Template)')
  console.log('---')
  try {
    const res3 = await fetch(`${BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'Add sales charts and customer table',
        framework: 'react',
        style: 'modern',
        useTemplate: 'dashboard',
        includeDatabase: true
      })
    })
    const data3 = await res3.json()
    console.log('✅ Succès:', data3.success)
    console.log('   Code length:', data3.code?.length || 0, 'caractères')
    console.log('   Metadata:', JSON.stringify(data3.metadata, null, 2))
  } catch (error) {
    console.error('❌ Erreur:', error.message)
  }
  console.log('\n')

  // Test 4: POST Erreur - Prompt vide
  console.log('❌ Test 4: POST /api/generate (Erreur - Prompt vide)')
  console.log('---')
  try {
    const res4 = await fetch(`${BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: '',
        framework: 'html'
      })
    })
    const data4 = await res4.json()
    console.log('✅ Erreur attendue:', data4.error)
  } catch (error) {
    console.error('❌ Erreur:', error.message)
  }
  console.log('\n')

  // Test 5: POST Erreur - Framework invalide
  console.log('❌ Test 5: POST /api/generate (Erreur - Framework invalide)')
  console.log('---')
  try {
    const res5 = await fetch(`${BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'A simple app',
        framework: 'angular'
      })
    })
    const data5 = await res5.json()
    console.log('✅ Erreur attendue:', data5.error)
  } catch (error) {
    console.error('❌ Erreur:', error.message)
  }
  console.log('\n')

  // Test 6: POST Vue avec Style Minimal
  console.log('🎨 Test 6: POST /api/generate (Vue + Minimal)')
  console.log('---')
  try {
    const res6 = await fetch(`${BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'A minimalist portfolio page',
        framework: 'vue',
        style: 'minimal'
      })
    })
    const data6 = await res6.json()
    console.log('✅ Succès:', data6.success)
    console.log('   Framework:', data6.metadata?.framework)
    console.log('   Style:', data6.metadata?.style)
  } catch (error) {
    console.error('❌ Erreur:', error.message)
  }
  console.log('\n')

  // Test 7: POST avec toutes les options
  console.log('🚀 Test 7: POST /api/generate (Toutes les options)')
  console.log('---')
  try {
    const res7 = await fetch(`${BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'E-commerce with product grid, filters, and shopping cart',
        framework: 'react',
        style: 'colorful',
        useTemplate: 'e-commerce',
        includeDatabase: true
      })
    })
    const data7 = await res7.json()
    console.log('✅ Succès:', data7.success)
    console.log('   Metadata:', JSON.stringify(data7.metadata, null, 2))
  } catch (error) {
    console.error('❌ Erreur:', error.message)
  }
  console.log('\n')

  console.log('✅ Tests terminés !')
  console.log('\n💡 Conseil: Si des tests échouent, vérifier:')
  console.log('   - Le serveur est lancé (npm run dev)')
  console.log('   - La variable ANTHROPIC_API_KEY est définie')
  console.log('   - Le port 3000 est disponible')
}

// Exécuter les tests
testAPI().catch(console.error)