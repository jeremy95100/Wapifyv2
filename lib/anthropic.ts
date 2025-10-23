import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export interface GenerateOptions {
  prompt: string
  conversationHistory?: Array<{role: 'user' | 'assistant', content: string}>
}

export interface ColorTheme {
  name: string
  primary: string
  secondary: string
  accent: string
  background: string
  text: string
}

export interface GenerationPlan {
  framework: 'react' | 'html' | 'vue'
  style: 'modern' | 'minimal' | 'colorful'
  template: string
  colorTheme: ColorTheme
  entities: Array<{name: string, fields: Array<{name: string, type: string}>}>
  features: string[]
}

export interface GenerationStep {
  step: string
  status: 'pending' | 'in_progress' | 'completed'
  description: string
}

export interface ModificationDetail {
  type: 'page' | 'component' | 'entity' | 'style' | 'feature'
  name: string
  action: 'created' | 'modified' | 'deleted'
  description: string
}

// Prompt système pour l'analyse et la planification
const PLANNING_SYSTEM_PROMPT = `You are Wapify AI, an intelligent React application architect.

Your job is to analyze user requirements and create a generation plan for React applications.

FRAMEWORK SELECTION:
- ALWAYS use React with Vite (Wapify is specialized in React apps only)
- Generate modern React applications with hooks and functional components
- Use component-based architecture for all applications

STYLE SELECTION:
- modern: For professional, corporate, SaaS apps (gradients, shadows, glassmorphism)
- minimal: For content-focused, blogs, portfolios (clean, typography-focused)
- colorful: For creative, playful, children's apps (vibrant, energetic)

TEMPLATE DETECTION:
- landing-page: Marketing sites, product pages, hero sections
- dashboard: Analytics, admin panels, data visualization
- portfolio: Personal sites, showcases, creative work
- e-commerce: Product catalogs, shopping carts, stores
- blog: Articles, posts, content sites
- auth: Login, signup, authentication flows
- custom: Anything else

COLOR THEME SELECTION (CRITICAL - Choose based on context):
Analyze the user's request and choose an appropriate color theme:

- E-commerce/Premium stores: {"name": "Premium", "primary": "#000000", "secondary": "#1A1A1A", "accent": "#D4AF37", "background": "#FFFFFF", "text": "#000000"}
- Business/Corporate/SaaS: {"name": "Professional", "primary": "#1E40AF", "secondary": "#3B82F6", "accent": "#10B981", "background": "#F9FAFB", "text": "#111827"}
- Creative/Portfolio/Agency: {"name": "Creative", "primary": "#8B5CF6", "secondary": "#EC4899", "accent": "#F59E0B", "background": "#FFFFFF", "text": "#1F2937"}
- Tech/Startup/Modern: {"name": "Modern Tech", "primary": "#6366F1", "secondary": "#8B5CF6", "accent": "#EC4899", "background": "#0F172A", "text": "#F8FAFC"}
- Health/Wellness: {"name": "Fresh", "primary": "#059669", "secondary": "#10B981", "accent": "#34D399", "background": "#F0FDF4", "text": "#064E3B"}
- Food/Restaurant: {"name": "Warm", "primary": "#DC2626", "secondary": "#EA580C", "accent": "#F59E0B", "background": "#FFF7ED", "text": "#431407"}
- Kids/Playful: {"name": "Playful", "primary": "#F59E0B", "secondary": "#EC4899", "accent": "#8B5CF6", "background": "#FEF3C7", "text": "#78350F"}
- Finance/Banking: {"name": "Trust", "primary": "#1E3A8A", "secondary": "#1E40AF", "accent": "#3B82F6", "background": "#EFF6FF", "text": "#1E3A8A"}
- Blog/Content: {"name": "Clean", "primary": "#374151", "secondary": "#6B7280", "accent": "#F59E0B", "background": "#FFFFFF", "text": "#111827"}

DATABASE ENTITIES:
- Analyze the requirements and extract entities (e.g., User, Product, Order)
- For each entity, define fields with types (string, number, boolean, date, array)
- Include realistic relationships between entities

RESPONSE FORMAT (JSON only):
{
  "framework": "react",
  "style": "modern",
  "template": "e-commerce",
  "colorTheme": {
    "name": "Premium",
    "primary": "#000000",
    "secondary": "#1A1A1A",
    "accent": "#D4AF37",
    "background": "#FFFFFF",
    "text": "#000000"
  },
  "entities": [
    {
      "name": "Product",
      "fields": [
        {"name": "id", "type": "string"},
        {"name": "name", "type": "string"},
        {"name": "price", "type": "number"},
        {"name": "image", "type": "string"}
      ]
    }
  ],
  "features": ["Product catalog", "Shopping cart", "Checkout flow"]
}

Analyze the user's request and respond with ONLY the JSON plan.`

// Prompt système pour la génération de code React
const CODE_GENERATION_SYSTEM_PROMPT = `You are Wapify AI, an expert in generating professional React applications.

CRITICAL RULES FOR REACT:
- Generate COMPLETE, PRODUCTION-READY React code
- Use JavaScript (NOT TypeScript) - NO type annotations, NO interfaces, NO generic types like <Type[]>
- IMPORTANT: Babel in-browser does NOT support TypeScript syntax - use plain JavaScript only
- Use PropTypes for type checking if needed, but prefer plain JavaScript
- Include ALL necessary imports and dependencies
- Use Tailwind CSS with custom colors (will be provided in the prompt)
- Create responsive, mobile-first designs with React components
- Include proper error handling and loading states
- NEVER use localStorage or sessionStorage (not supported in iframe)
- Add meaningful comments for complex logic
- Ensure accessibility (ARIA labels, semantic HTML)

REACT APPLICATION STRUCTURE:
- Create a multi-component architecture
- Use React Router for navigation (if needed)
- Use React hooks (useState, useEffect, useContext, etc.)
- Separate concerns: components, hooks, utilities
- Create reusable components

CONTENT REQUIREMENTS (CRITICAL - Make it VERY impressive):
- MINIMUM 5-8 pages/sections (not just 3!)
- For dashboards: Dashboard, Analytics, Users, Reports, Settings, Profile, Notifications, Support
- For e-commerce: Home, Products Grid, Product Detail, Cart, Checkout, Orders, Profile, Wishlist
- For portfolios: Home, Projects Gallery, Project Details, About, Skills, Experience, Contact, Blog
- For blogs: Home, Articles List, Article Detail, Categories, Tags, About, Contact, Archive
- For SaaS: Landing, Features, Pricing, Dashboard, Settings, Billing, Support, Documentation
- Each page must be FULLY FUNCTIONAL with smooth navigation
- Include realistic loading states and animations

DATABASE IMPLEMENTATION (CRITICAL - Rich data):
- Create mock data in JavaScript objects/arrays
- MINIMUM 30-50 realistic items per main entity!
- Example: E-commerce should have 40-60 products with categories, not just 10
- Example: Blog should have 25-40 articles with full content, authors, dates
- Example: Dashboard should have 50+ data points for charts and tables
- Implement full CRUD operations with in-memory state
- Include validation and error handling
- Show realistic loading states (minimum 300ms simulation)
- Add detailed, realistic data: full names, long descriptions, prices, dates, images URLs, tags, categories, relationships
- Include user profiles, comments, reviews, ratings where applicable
- Add statistics and metrics (views, likes, shares, etc.)

INTERACTIVITY REQUIREMENTS (Make it feel ALIVE):
- ALL buttons must be functional (no dead buttons!)
- Add smooth transitions and animations (hover, click, scroll, fade-in)
- Include interactive elements: modals, dropdowns, tabs, accordions, tooltips, popovers
- Add form validation with visual feedback (error messages, success states)
- Include advanced search with filters, sorting, and autocomplete
- Add pagination AND infinite scroll options
- Include success/error toast notifications (slide in from top-right)
- Add skeleton loaders for loading states
- Include drag-and-drop where applicable
- Add keyboard shortcuts and accessibility features
- Include tooltips on hover for buttons and icons
- Add confirm dialogs for destructive actions
- Include progress bars for multi-step processes

CODE QUALITY:
- Clean, readable, production-ready code
- Follow framework best practices
- Proper component composition
- Meaningful variable names
- DRY principles

CRITICAL OUTPUT FORMAT:
- Return ONLY the raw code, starting immediately with the code itself
- DO NOT wrap in markdown code blocks (no \`\`\`html, \`\`\`tsx, \`\`\`javascript, etc.)
- DO NOT add any explanations, comments, or descriptions before or after the code
- For HTML: Start directly with <!DOCTYPE html>
- For React: DO NOT use import/export statements - they will be removed anyway
- For React: Write ONLY the component code that will be wrapped in a <script type="text/babel"> tag
- For React: NO module.exports, NO exports, NO require - browser only!
- For Vue: Start directly with <template>
- The first character of your response must be the first character of the code`

// Fonction pour créer un plan de génération intelligent
export async function createGenerationPlan(prompt: string): Promise<GenerationPlan> {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      temperature: 0.3, // Plus déterministe pour la planification
      messages: [{
        role: 'user',
        content: `${PLANNING_SYSTEM_PROMPT}\n\nUser request: ${prompt}`
      }],
    })

    const content = message.content[0]
    const response = content.type === 'text' ? content.text : ''

    // Extraire le JSON de la réponse
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to parse generation plan')
    }

    const plan = JSON.parse(jsonMatch[0]) as GenerationPlan

    // Validation du plan
    if (!plan.framework || !plan.style || !plan.template) {
      throw new Error('Invalid generation plan')
    }

    return plan

  } catch (error) {
    console.error('Error creating generation plan:', error)

    // Plan par défaut en cas d'erreur
    return {
      framework: 'react',
      style: 'modern',
      template: 'custom',
      colorTheme: {
        name: 'Professional',
        primary: '#1E40AF',
        secondary: '#3B82F6',
        accent: '#10B981',
        background: '#F9FAFB',
        text: '#111827'
      },
      entities: [],
      features: ['Implement based on user requirements']
    }
  }
}

// ⚠️ DEPRECATED - Wapify utilise maintenant React uniquement
// Cette fonction était utilisée pour générer du HTML, mais n'est plus nécessaire
// Conservée pour référence historique
/*
export async function* generateAppCodeWithSteps(
  options: GenerateOptions
): AsyncGenerator<{type: 'step' | 'plan' | 'code' | 'substep' | 'modifications' | 'final_code' | 'complete', data: any}> {
  const { prompt, conversationHistory = [] } = options

  // Étape 1: Analyse et planification
  yield {
    type: 'step',
    data: {
      step: 'Analyse de votre demande',
      status: 'in_progress',
      description: 'Analyse des besoins et création du plan'
    }
  }

  const plan = await createGenerationPlan(prompt)

  yield {
    type: 'plan',
    data: plan
  }

  yield {
    type: 'step',
    data: {
      step: 'Analyse de votre demande',
      status: 'completed',
      description: `${plan.framework.toUpperCase()} · ${plan.template} · ${plan.style}`
    }
  }

  // Étape 2: Génération de la structure DB
  if (plan.entities.length > 0) {
    yield {
      type: 'step',
      data: {
        step: 'Création de la base de données',
        status: 'in_progress',
        description: `Génération de ${plan.entities.length} entité(s)`
      }
    }

    await new Promise(resolve => setTimeout(resolve, 1000))

    yield {
      type: 'step',
      data: {
        step: 'Création de la base de données',
        status: 'completed',
        description: `${plan.entities.map(e => e.name).join(', ')}`
      }
    }
  }

  // Étape 3: Création de la page principale
  const templateDescriptions = {
    'landing-page': 'avec hero, features et CTA',
    'dashboard': 'avec graphiques et statistiques',
    'portfolio': 'avec galerie et présentation',
    'e-commerce': 'avec catalogue et panier',
    'blog': 'avec articles et navigation',
    'auth': 'avec login et validation',
    'custom': `style ${plan.style}`
  }

  yield {
    type: 'step',
    data: {
      step: `Création page ${plan.template}`,
      status: 'in_progress',
      description: `Interface ${plan.style} ${templateDescriptions[plan.template as keyof typeof templateDescriptions] || ''}`
    }
  }

  await new Promise(resolve => setTimeout(resolve, 800))

  yield {
    type: 'step',
    data: {
      step: `Création page ${plan.template}`,
      status: 'completed',
      description: `Page principale en ${plan.framework.toUpperCase()} créée`
    }
  }

  // Étape 4: Génération des entités
  const modifications: ModificationDetail[] = []

  if (plan.entities.length > 0) {
    for (let i = 0; i < plan.entities.length; i++) {
      const entity = plan.entities[i]
      const fieldTypes = entity.fields.map(f => f.type)
      const uniqueTypes = [...new Set(fieldTypes)]

      yield {
        type: 'step',
        data: {
          step: `Génération entité ${entity.name}`,
          status: 'in_progress',
          description: `${entity.fields.length} champs (${uniqueTypes.slice(0, 2).join(', ')}${uniqueTypes.length > 2 ? '...' : ''})`
        }
      }

      await new Promise(resolve => setTimeout(resolve, 600))

      yield {
        type: 'step',
        data: {
          step: `Génération entité ${entity.name}`,
          status: 'completed',
          description: `CRUD complet avec mock data`
        }
      }

      modifications.push({
        type: 'entity',
        name: `Entité ${entity.name}`,
        action: 'created',
        description: `BD: ${entity.fields.length} champs (${uniqueTypes.join(', ')}) • CRUD complet`
      })
    }
  }

  // Étape 5: Intégration des features
  if (plan.features.length > 0) {
    const mainFeatures = plan.features.slice(0, 3)

    for (let i = 0; i < mainFeatures.length; i++) {
      const feature = mainFeatures[i]

      yield {
        type: 'step',
        data: {
          step: `Feature: ${feature.substring(0, 30)}${feature.length > 30 ? '...' : ''}`,
          status: 'in_progress',
          description: `Intégration en ${plan.framework.toUpperCase()}`
        }
      }

      await new Promise(resolve => setTimeout(resolve, 500))

      yield {
        type: 'step',
        data: {
          step: `Feature: ${feature.substring(0, 30)}${feature.length > 30 ? '...' : ''}`,
          status: 'completed',
          description: `Fonctionnalité ajoutée`
        }
      }

      modifications.push({
        type: 'feature',
        name: feature,
        action: 'created',
        description: `Intégré dans ${plan.framework.toUpperCase()}`
      })
    }
  }

  // Ajouter la page principale aux modifications
  modifications.unshift({
    type: 'page',
    name: `Page ${plan.template}`,
    action: 'created',
    description: `Interface ${plan.style} ${templateDescriptions[plan.template as keyof typeof templateDescriptions] || ''}`
  })

  yield {
    type: 'modifications',
    data: modifications
  }

  // Étape finale: Génération du code complet
  yield {
    type: 'step',
    data: {
      step: 'Assemblage final',
      status: 'in_progress',
      description: 'Compilation et optimisation du code'
    }
  }

  // Construction du prompt enrichi
  let enrichedPrompt = `Create a ${plan.style} ${plan.template} application using ${plan.framework.toUpperCase()}.\n\n`
  enrichedPrompt += `User requirements: ${prompt}\n\n`

  if (plan.entities.length > 0) {
    enrichedPrompt += `DATABASE SCHEMA:\n`
    plan.entities.forEach(entity => {
      enrichedPrompt += `- ${entity.name}: ${entity.fields.map(f => `${f.name}: ${f.type}`).join(', ')}\n`
    })
    enrichedPrompt += `\nImplement full CRUD operations with realistic mock data.\n\n`
  }

  if (plan.features.length > 0) {
    enrichedPrompt += `KEY FEATURES:\n${plan.features.map(f => `- ${f}`).join('\n')}\n\n`
  }

  // Style instructions
  const styleInstructions = {
    modern: 'Use gradients, shadows, rounded corners, and smooth animations. Modern glassmorphism effects.',
    minimal: 'Clean, simple design with lots of white space. Focus on typography and clarity.',
    colorful: 'Bold, vibrant colors with playful elements. Make it energetic and engaging.'
  }
  enrichedPrompt += `STYLE: ${styleInstructions[plan.style]}\n\n`

  // Color theme instructions
  enrichedPrompt += `COLOR THEME "${plan.colorTheme.name}":\n`
  enrichedPrompt += `- Primary color: ${plan.colorTheme.primary}\n`
  enrichedPrompt += `- Secondary color: ${plan.colorTheme.secondary}\n`
  enrichedPrompt += `- Accent color: ${plan.colorTheme.accent}\n`
  enrichedPrompt += `- Background: ${plan.colorTheme.background}\n`
  enrichedPrompt += `- Text color: ${plan.colorTheme.text}\n`
  enrichedPrompt += `Use these colors in Tailwind with style="color: ${plan.colorTheme.primary}" or inline styles when needed.\n\n`

  // Ajout de l'historique de conversation si existant
  const messages: Array<{role: 'user' | 'assistant', content: string}> = []

  if (conversationHistory.length > 0) {
    messages.push(...conversationHistory)
  }

  messages.push({
    role: 'user',
    content: `${CODE_GENERATION_SYSTEM_PROMPT}\n\n${enrichedPrompt}\n\nIMPORTANT: Return the complete ${plan.framework === 'html' ? 'HTML document' : plan.framework === 'react' ? 'React component' : 'Vue component'} with all functionality implemented. Remember: MINIMUM 3-5 pages/sections and 15-30 data items!`
  })

  try {
    const stream = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      temperature: 0.7,
      stream: true,
      messages: messages,
    })

    let fullCode = ''
    let charCount = 0
    const estimatedTotalChars = 6000 // Estimation moyenne
    let lastProgressUpdate = 0

    // Sous-étapes détaillées pour l'assemblage
    const subSteps = [
      { at: 0, step: 'Génération structure HTML', desc: 'Création de la structure de base' },
      { at: 20, step: 'Ajout composants UI', desc: 'Intégration des éléments d\'interface' },
      { at: 45, step: 'Intégration données', desc: 'Ajout de la logique et des données' },
      { at: 70, step: 'Stylisation Tailwind', desc: 'Application des styles CSS' },
      { at: 90, step: 'Interactivité JavaScript', desc: 'Ajout des fonctionnalités interactives' }
    ]

    let currentSubStepIndex = 0

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        fullCode += event.delta.text
        charCount += event.delta.text.length

        // Calculer le progrès
        const progress = Math.min(99, Math.floor((charCount / estimatedTotalChars) * 100))

        // Mettre à jour la sous-étape si nécessaire
        if (currentSubStepIndex < subSteps.length - 1 && progress >= subSteps[currentSubStepIndex + 1].at) {
          // Compléter l'étape précédente
          yield {
            type: 'substep',
            data: {
              step: subSteps[currentSubStepIndex].step,
              status: 'completed',
              description: subSteps[currentSubStepIndex].desc,
              progress: 100
            }
          }

          currentSubStepIndex++

          // Démarrer la nouvelle sous-étape
          yield {
            type: 'substep',
            data: {
              step: subSteps[currentSubStepIndex].step,
              status: 'in_progress',
              description: subSteps[currentSubStepIndex].desc,
              progress: 0
            }
          }
        }

        // Mettre à jour le progrès toutes les 5%
        if (progress - lastProgressUpdate >= 5) {
          lastProgressUpdate = progress
          const subStepProgress = currentSubStepIndex < subSteps.length - 1
            ? Math.min(100, ((progress - subSteps[currentSubStepIndex].at) / (subSteps[currentSubStepIndex + 1].at - subSteps[currentSubStepIndex].at)) * 100)
            : Math.min(100, ((progress - subSteps[currentSubStepIndex].at) / (100 - subSteps[currentSubStepIndex].at)) * 100)

          yield {
            type: 'substep',
            data: {
              step: subSteps[currentSubStepIndex].step,
              status: 'in_progress',
              description: subSteps[currentSubStepIndex].desc,
              progress: Math.floor(subStepProgress)
            }
          }
        }

        yield {
          type: 'code',
          data: event.delta.text
        }
      }
    }

    // Compléter la dernière sous-étape
    if (currentSubStepIndex < subSteps.length) {
      yield {
        type: 'substep',
        data: {
          step: subSteps[currentSubStepIndex].step,
          status: 'completed',
          description: subSteps[currentSubStepIndex].desc,
          progress: 100
        }
      }
    }

    // Extraire et nettoyer le code final
    const cleanedCode = extractCode(fullCode)

    // Si c'est du HTML et qu'il manque la structure, l'ajouter
    let finalCode = cleanedCode
    if (plan.framework === 'html' && !cleanedCode.includes('<!DOCTYPE')) {
      finalCode = ensureHTMLStructure(cleanedCode)
    } else if (plan.framework === 'react') {
      // Pour React, on doit créer un HTML qui peut exécuter du JSX
      finalCode = wrapReactInHTML(cleanedCode)
    }

    // CORRECTION AUTOMATIQUE DE LA NAVIGATION (garantit que les pages fonctionnent)
    finalCode = fixNavigation(finalCode)

    // Envoyer le code final nettoyé
    yield {
      type: 'final_code',
      data: finalCode
    }

    yield {
      type: 'step',
      data: {
        step: 'Assemblage final',
        status: 'completed',
        description: 'Code compilé et optimisé'
      }
    }

    // Étape finale: Préparation de l'aperçu
    yield {
      type: 'step',
      data: {
        step: 'Préparation aperçu',
        status: 'in_progress',
        description: 'Chargement dans la preview'
      }
    }

    await new Promise(resolve => setTimeout(resolve, 500))

    yield {
      type: 'step',
      data: {
        step: 'Préparation aperçu',
        status: 'completed',
        description: 'Application prête !'
      }
    }

  } catch (error) {
    console.error('Error generating code:', error)
    throw new Error('Failed to generate code with AI')
  }
}
*/

// Fonction pour générer des projets React multi-fichiers avec étapes
export async function* generateReactProjectWithSteps(
  options: GenerateOptions
): AsyncGenerator<{type: 'step' | 'plan' | 'substep' | 'modifications' | 'files' | 'complete' | 'chat_message', data: any}> {
  const { prompt } = options

  // Étape 1: Planification
  yield {
    type: 'step',
    data: {
      step: 'Planification',
      status: 'in_progress',
      description: 'Création du plan de projet'
    }
  }

  const plan = await createGenerationPlan(prompt)

  yield {
    type: 'plan',
    data: plan
  }

  yield {
    type: 'step',
    data: {
      step: 'Planification',
      status: 'completed',
      description: `React · ${plan.template} · ${plan.style}`
    }
  }

  // Étape 2: Génération de la structure de fichiers (AGENT CRÉATEUR)
  yield {
    type: 'step',
    data: {
      step: 'Génération de la structure',
      status: 'in_progress',
      description: 'Agent créateur en action...'
    }
  }

  // Messages de chat pour l'étape de création
  yield {
    type: 'chat_message',
    data: 'SECTION_START:Plan de l\'Application'
  }

  yield {
    type: 'chat_message',
    data: 'PLAN_DESCRIPTION:Je vais créer une application React avec les fonctionnalités demandées.'
  }

  // Import du générateur React
  const { generateReactProject, validateAndFixProject } = require('./react-generator')

  const projectStructure = await generateReactProject(prompt, anthropic)

  const modifications: ModificationDetail[] = []

  // Compter les fichiers par type
  const componentFiles = projectStructure.files.filter((f: any) => f.type === 'component').length
  const hookFiles = projectStructure.files.filter((f: any) => f.type === 'hook').length
  const styleFiles = projectStructure.files.filter((f: any) => f.type === 'style').length

  modifications.push({
    type: 'component',
    name: 'Structure React',
    action: 'created',
    description: `${projectStructure.files.length} fichiers générés (${componentFiles} composants, ${hookFiles} hooks, ${styleFiles} styles)`
  })

  // Envoyer les détails des fichiers créés
  const pages = projectStructure.files.filter((f: any) => f.path.includes('/pages/'))
  const components = projectStructure.files.filter((f: any) => f.path.includes('/components/'))

  for (const page of pages) {
    const pageName = page.path.split('/').pop()?.replace(/\.(tsx|jsx)$/, '')
    yield {
      type: 'chat_message',
      data: `SUBSTEP:✓ ${pageName} créée`
    }
  }

  for (const comp of components.filter((c: any) => c.path.includes('/ui/'))) {
    const compName = comp.path.split('/').pop()?.replace(/\.(tsx|jsx)$/, '')
    yield {
      type: 'chat_message',
      data: `SUBSTEP:✓ Composant ${compName}`
    }
  }

  yield {
    type: 'chat_message',
    data: 'SECTION_END'
  }

  yield {
    type: 'step',
    data: {
      step: 'Génération de la structure',
      status: 'completed',
      description: `${projectStructure.files.length} fichiers créés`
    }
  }

  // Étape 3: Configuration de la base de données (si nécessaire)
  if (projectStructure.hasDatabase) {
    yield {
      type: 'step',
      data: {
        step: 'Configuration base de données',
        status: 'in_progress',
        description: 'Préparation du schéma SQL'
      }
    }

    modifications.push({
      type: 'feature',
      name: 'Base de données',
      action: 'created',
      description: 'Schéma SQL généré pour Neon PostgreSQL'
    })

    yield {
      type: 'step',
      data: {
        step: 'Configuration base de données',
        status: 'completed',
        description: 'Schéma prêt pour déploiement'
      }
    }
  }

  // Étape 4: Configuration des dépendances
  yield {
    type: 'step',
    data: {
      step: 'Configuration dépendances',
      status: 'in_progress',
      description: 'Préparation package.json et Vite'
    }
  }

  modifications.push({
    type: 'feature',
    name: 'Configuration build',
    action: 'created',
    description: 'Vite + React + Tailwind configurés'
  })

  yield {
    type: 'step',
    data: {
      step: 'Configuration dépendances',
      status: 'completed',
      description: 'Projet prêt pour le développement'
    }
  }

  // Envoyer les modifications
  yield {
    type: 'modifications',
    data: modifications
  }

  // Envoyer les fichiers générés
  yield {
    type: 'files',
    data: projectStructure
  }

  // Étape finale
  yield {
    type: 'step',
    data: {
      step: 'Finalisation',
      status: 'in_progress',
      description: 'Préparation du projet'
    }
  }

  yield {
    type: 'step',
    data: {
      step: 'Finalisation',
      status: 'completed',
      description: 'Projet React prêt !'
    }
  }

  // Message final élégant
  const pageNames = projectStructure.files
    .filter((f: any) => f.path.includes('/pages/'))
    .map((f: any) => f.path.split('/').pop()?.replace(/\.(tsx|jsx)$/, ''))
    .join(', ')

  yield {
    type: 'chat_message',
    data: `FINAL_MESSAGE:J'ai créé une application React complète avec ${projectStructure.files.length} fichiers (${pageNames}). L'application est prête à être compilée et déployée ! 🎉`
  }

  yield {
    type: 'complete',
    data: projectStructure
  }
}

// Fonction pour les modifications conversationnelles
export async function modifyAppCode(
  currentCode: string,
  modification: string,
  conversationHistory: Array<{role: 'user' | 'assistant', content: string}>
): Promise<string> {
  try {
    // Nettoyer les messages pour ne garder que role et content
    const cleanedHistory = conversationHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    }))

    const messages: Array<{role: 'user' | 'assistant', content: string}> = [
      ...cleanedHistory,
      {
        role: 'user',
        content: `Current code:\n\`\`\`\n${currentCode}\n\`\`\`\n\nUser modification request: ${modification}\n\nReturn the COMPLETE modified code, not just the changes.`
      }
    ]

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      temperature: 0.7,
      messages: messages,
    })

    const content = message.content[0]
    const response = content.type === 'text' ? content.text : ''

    return extractCode(response)

  } catch (error) {
    console.error('Error modifying code:', error)
    throw new Error('Failed to modify code with AI')
  }
}

// Fonction pour modifier un projet React multi-fichiers
export async function modifyReactProject(
  projectFiles: Array<{path: string, content: string}>,
  modification: string,
  conversationHistory: Array<{role: 'user' | 'assistant', content: string}>
): Promise<Array<{path: string, content: string}>> {
  try {
    console.log('🔄 Modification React multi-fichiers:', {
      filesCount: projectFiles.length,
      modification: modification.substring(0, 100)
    })

    // Construire le contexte des fichiers
    const filesContext = projectFiles.map(f =>
      `**${f.path}:**\n\`\`\`\n${f.content}\n\`\`\``
    ).join('\n\n')

    const cleanedHistory = conversationHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    }))

    const messages: Array<{role: 'user' | 'assistant', content: string}> = [
      ...cleanedHistory,
      {
        role: 'user',
        content: `I have a React multi-file project with the following files:

${filesContext}

User modification request: ${modification}

Please return the COMPLETE modified files in the following JSON format:
\`\`\`json
{
  "files": [
    {
      "path": "src/App.jsx",
      "content": "... complete file content ..."
    }
  ]
}
\`\`\`

IMPORTANT:
- Return ALL files, even if unchanged
- Include complete file content, not just changes
- Maintain the exact same file paths
- Keep the JSON structure exactly as shown`
      }
    ]

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 16000,
      temperature: 0.7,
      messages: messages,
    })

    const content = message.content[0]
    const response = content.type === 'text' ? content.text : ''

    // Extraire le JSON de la réponse
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/)
    if (!jsonMatch) {
      console.error('❌ No JSON found in response')
      throw new Error('AI did not return valid JSON format')
    }

    const parsed = JSON.parse(jsonMatch[1])

    if (!parsed.files || !Array.isArray(parsed.files)) {
      throw new Error('Invalid response format: missing files array')
    }

    console.log('✅ Modified files:', parsed.files.length)
    return parsed.files

  } catch (error) {
    console.error('❌ Error modifying React project:', error)
    throw new Error('Failed to modify React project with AI')
  }
}

// Fonction pour corriger la navigation dans le code HTML
function fixNavigation(html: string): string {
  let fixed = html

  // 1. Remplacer <a href="#something"> par onclick
  fixed = fixed.replace(
    /<a\s+href=["']#(\w+)["']([^>]*)>/gi,
    (match, page, attrs) => {
      // Garder les classes et attributs mais remplacer le href
      return `<a href="#" onclick="event.preventDefault(); showPage('${page}'); return false;"${attrs}>`
    }
  )

  // 2. Remplacer <a href="page.html"> par onclick
  fixed = fixed.replace(
    /<a\s+href=["'](\w+)\.html["']([^>]*)>/gi,
    (match, page, attrs) => {
      return `<a href="#" onclick="event.preventDefault(); showPage('${page}'); return false;"${attrs}>`
    }
  )

  // 3. Remplacer <a href="/page"> par onclick
  fixed = fixed.replace(
    /<a\s+href=["']\/(\w+)["']([^>]*)>/gi,
    (match, page, attrs) => {
      return `<a href="#" onclick="event.preventDefault(); showPage('${page}'); return false;"${attrs}>`
    }
  )

  // 4. TOUJOURS injecter la fonction showPage (remplacer si existe déjà)
  const showPageFunction = `
    <script>
      // ===== WAPIFY NAVIGATION SYSTEM =====
      let currentPage = 'home';

      function showPage(pageName) {
        console.log('🔄 Wapify Navigation: Switching to page:', pageName);

        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
          page.style.display = 'none';
          page.classList.remove('active');
        });

        // Show selected page with multiple ID formats support
        let targetPage = document.getElementById('page-' + pageName);
        if (!targetPage) {
          targetPage = document.getElementById(pageName);
        }
        if (!targetPage) {
          targetPage = document.querySelector('[data-page="' + pageName + '"]');
        }

        if (targetPage) {
          targetPage.style.display = 'block';
          targetPage.classList.add('active');
          currentPage = pageName;
          window.location.hash = pageName;

          // Scroll to top
          window.scrollTo(0, 0);
        } else {
          console.error('❌ Wapify Navigation: Page not found:', pageName);
          console.log('Available page IDs:',
            Array.from(document.querySelectorAll('[id^="page-"]')).map(el => el.id)
          );
        }
      }

      // Initialize on load
      window.addEventListener('DOMContentLoaded', () => {
        const initialPage = window.location.hash.slice(1) || 'home';
        console.log('✅ Wapify Navigation: System initialized, loading page:', initialPage);
        showPage(initialPage);
      });

      // Handle browser back/forward
      window.addEventListener('hashchange', () => {
        const page = window.location.hash.slice(1) || 'home';
        showPage(page);
      });
    </script>
    `

  // Supprimer toute fonction showPage existante (peut-être cassée)
  fixed = fixed.replace(/<script>[\s\S]*?function showPage[\s\S]*?<\/script>/gi, '')

  // Insérer notre fonction avant </body> ou à la fin si </body> n'existe pas
  if (fixed.includes('</body>')) {
    fixed = fixed.replace('</body>', showPageFunction + '\n</body>')
  } else if (fixed.includes('</html>')) {
    fixed = fixed.replace('</html>', showPageFunction + '\n</html>')
  } else {
    // En dernier recours, ajouter à la fin
    fixed += showPageFunction
  }

  return fixed
}

// Fonction pour wrapper le code React dans un HTML exécutable
function wrapReactInHTML(reactCode: string): string {
  // Nettoyer le code : enlever imports/exports
  let cleanedCode = reactCode
    .replace(/^import.*?;$/gm, '') // Enlever imports
    .replace(/^export\s+(default\s+)?/gm, '') // Enlever exports
    .replace(/module\.exports\s*=\s*.+?;?$/gm, '') // Enlever module.exports
    .replace(/exports\.\w+\s*=\s*.+?;?$/gm, '') // Enlever exports.xxx
    .trim()

  // Si le code commence par "function App" ou "const App", pas besoin de modification
  // Sinon, il faut peut-être qu'on extraie le composant principal

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Wapify App</title>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    const { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } = React;

    ${cleanedCode}

    // Render the app
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<App />);
  </script>
</body>
</html>`
}

// Fonction pour s'assurer que le HTML est complet
function ensureHTMLStructure(code: string): string {
  // Si le code n'a pas de doctype, le wrapper
  if (!code.includes('<!DOCTYPE') && !code.includes('<html')) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Wapify Generated App</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background-color: #F5F3EF;
      color: #2C1810;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  ${code}
</body>
</html>`
  }

  return code
}

// Fonction pour extraire le code des blocs markdown
function extractCode(response: string): string {
  // Nettoyer la réponse
  let cleaned = response.trim()

  // Cherche les blocs de code avec différents langages (plus robuste)
  const codeBlockRegex = /```[\w]*\n?([\s\S]*?)```/g
  const matches = [...cleaned.matchAll(codeBlockRegex)]

  if (matches.length > 0) {
    // Si plusieurs blocs, prendre le plus long (probablement le code principal)
    const longestBlock = matches.reduce((longest, current) =>
      current[1].length > longest[1].length ? current : longest
    )
    cleaned = longestBlock[1].trim()
  }

  // Supprimer les balises markdown au début si elles existent encore
  cleaned = cleaned.replace(/^```[\w]*\n?/, '')
  cleaned = cleaned.replace(/```$/, '')

  // Si ça commence déjà par du code valide, retourner tel quel
  if (cleaned.startsWith('<!DOCTYPE') ||
      cleaned.startsWith('<html') ||
      cleaned.startsWith('import ') ||
      cleaned.startsWith('<template>')) {
    return cleaned.trim()
  }

  // Si pas de bloc de code mais que ça ressemble à du HTML quelque part
  const htmlMatch = cleaned.match(/(<!DOCTYPE[\s\S]*)/i)
  if (htmlMatch) {
    return htmlMatch[1].trim()
  }

  // Si ça ressemble à du React/Vue
  const importMatch = cleaned.match(/(import[\s\S]*)/i)
  if (importMatch) {
    return importMatch[1].trim()
  }

  const templateMatch = cleaned.match(/(<template>[\s\S]*)/i)
  if (templateMatch) {
    return templateMatch[1].trim()
  }

  // Dernier recours : retourner tout nettoyé
  return cleaned.trim()
}

