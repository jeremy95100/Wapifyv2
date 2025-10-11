#!/bin/bash

# Script de test rapide pour l'API Wapify
# Usage: ./scripts/test-api.sh

echo "🧪 Test de l'API Wapify Generator"
echo "================================="
echo ""

BASE_URL="http://localhost:3000"

# Test 1: GET - Liste des options
echo "📋 Test 1: GET /api/generate (Liste des options)"
echo "---"
curl -s -X GET "$BASE_URL/api/generate" | jq '.'
echo ""
echo ""

# Test 2: POST Simple - Landing Page HTML
echo "🏠 Test 2: POST /api/generate (Landing Page HTML)"
echo "---"
curl -s -X POST "$BASE_URL/api/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A simple landing page with hero section and CTA button",
    "framework": "html",
    "style": "modern",
    "useTemplate": "dashboard",
    "includeDatabase": true
  }' | jq '.success, .message, .metadata'
echo ""
echo ""

# Test 4: POST Erreur - Prompt vide
echo "❌ Test 4: POST /api/generate (Erreur - Prompt vide)"
echo "---"
curl -s -X POST "$BASE_URL/api/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "",
    "framework": "html"
  }' | jq '.error'
echo ""
echo ""

# Test 5: POST Erreur - Framework invalide
echo "❌ Test 5: POST /api/generate (Erreur - Framework invalide)"
echo "---"
curl -s -X POST "$BASE_URL/api/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A simple app",
    "framework": "angular"
  }' | jq '.error'
echo ""
echo ""

# Test 6: POST Vue avec Style Minimal
echo "🎨 Test 6: POST /api/generate (Vue + Minimal)"
echo "---"
curl -s -X POST "$BASE_URL/api/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A minimalist portfolio page",
    "framework": "vue",
    "style": "minimal"
  }' | jq '.success, .message, .metadata'
echo ""
echo ""

# Test 7: POST avec toutes les options
echo "🚀 Test 7: POST /api/generate (Toutes les options)"
echo "---"
curl -s -X POST "$BASE_URL/api/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "E-commerce with product grid, filters, and shopping cart",
    "framework": "react",
    "style": "colorful",
    "useTemplate": "e-commerce",
    "includeDatabase": true
  }' | jq '.success, .message, .metadata'
echo ""
echo ""

echo "✅ Tests terminés !"
echo ""
echo "💡 Conseil: Si des tests échouent, vérifier:"
echo "   - Le serveur est lancé (npm run dev)"
echo "   - La variable ANTHROPIC_API_KEY est définie"
echo "   - jq est installé (pour formater le JSON)"
 "modern"
  }' | jq '.success, .message, .metadata'
echo ""
echo ""

# Test 3: POST avec Template - Dashboard React
echo "📊 Test 3: POST /api/generate (Dashboard React + Template)"
echo "---"
curl -s -X POST "$BASE_URL/api/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Add sales charts and customer table",
    "framework": "react",
    "style":