# Configuration Railway pour Wapify

## Architecture

- **Frontend**: Vercel Blob Storage (fichiers statiques)
- **Backend API**: Railway (Express.js)
- **Database**: Neon (PostgreSQL)

## Variables d'environnement requises

### Sur le Build Server (Railway worker)

Ajouter ces variables dans les settings Railway du service `build-server`:

```bash
# Railway API Token
RAILWAY_TOKEN=your_railway_api_token_here
RAILWAY_PROJECT_ID=your_railway_project_id_here

# GitHub Token (déjà configuré)
GITHUB_TOKEN=ghp_xxxxxxxxxxxxx
GITHUB_ORG=wapify-app

# Neon API (déjà configuré)
NEON_API_KEY=your_neon_api_key

# Redis (déjà configuré)
REDIS_URL=redis://...

# Anthropic (déjà configuré)
ANTHROPIC_API_KEY=sk-ant-...
```

## Comment obtenir les tokens Railway

### 1. RAILWAY_TOKEN (API Token)

**Option A: Team Token (recommandé pour production)**
1. Aller sur https://railway.com/account/tokens
2. Cliquer sur "Create Team Token"
3. Nom: `wapify-builder`
4. Permissions: Toutes (ou minimum: `projects.write`, `services.write`)
5. Copier le token généré

**Option B: Account Token (pour dev/test)**
1. Aller sur https://railway.com/account/tokens
2. Cliquer sur "Create Token"
3. Copier le token généré

### 2. RAILWAY_PROJECT_ID

**Méthode 1: Via l'URL du projet**
1. Aller sur votre projet Railway: https://railway.com/project/xxxxxxxx
2. L'ID est dans l'URL après `/project/`
3. Format: `8df3b1d6-2317-4400-b267-56c4a42eed06`

**Méthode 2: Via GraphQL**
```bash
curl https://backboard.railway.com/graphql/v2 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ projects { edges { node { id name } } } }"}'
```

## Workflow de déploiement

Quand un utilisateur génère une app avec database:

1. ✅ **Génération** du code React + Express API
2. ✅ **Création** de la branche Neon dédiée
3. ✅ **Création** du repo GitHub
4. ✅ **Déploiement** du code sur GitHub
5. 🆕 **Création** du service Railway (automatique)
   - Repo: `wapify-app/wapify-{nanoid}`
   - Variables: `DATABASE_URL`, `PORT=3001`, `NODE_ENV=production`
6. 🆕 **Injection** de l'URL API dans le frontend
   - Commit automatique de `.env.production` avec `VITE_API_URL`
7. ✅ **Build** du frontend avec Vite (Vercel Blob)

## Structure finale

```
GitHub Repo: wapify-app/wapify-k9jsun
├── src/              # Frontend React
├── api/              # Backend Express (déployé sur Railway)
└── .env.production   # VITE_API_URL (ajouté après Railway)

Neon Branch: proj-k9jsun
├── tasks table
├── users table
└── ...

Railway Service: wapify-api-k9jsun
├── Environment: DATABASE_URL (Neon)
├── Port: 3001
└── URL: https://wapify-api-k9jsun.up.railway.app
```

## Test du workflow

1. Définir les variables Railway sur le build-server
2. Générer une todo list via Wapify
3. Vérifier:
   - ✅ Repo GitHub créé avec `/api` folder
   - ✅ Service Railway créé automatiquement
   - ✅ Variables d'environnement configurées
   - ✅ `.env.production` committé avec VITE_API_URL
   - ✅ Frontend utilise `import.meta.env.VITE_API_URL`

## Troubleshooting

### Erreur: "RAILWAY_TOKEN must be set"
→ Ajouter `RAILWAY_TOKEN` dans les variables d'environnement Railway

### Erreur: "RAILWAY_PROJECT_ID must be set"
→ Ajouter `RAILWAY_PROJECT_ID` (UUID de votre projet Railway)

### Erreur: "Railway API error: 401"
→ Token expiré ou invalide, régénérer un nouveau token

### Erreur: "Railway API error: 403"
→ Token n'a pas les permissions nécessaires

### Service créé mais pas d'URL
→ Attendre ~30 secondes pour le premier déploiement
→ URL format: `https://{service-name}.up.railway.app`

## Architecture GraphQL Railway

Notre intégration utilise les mutations suivantes:

```graphql
# Créer un service
mutation ServiceCreate($input: ServiceCreateInput!) {
  serviceCreate(input: $input) {
    id
    name
  }
}

# Définir une variable d'environnement
mutation VariableUpsert($input: VariableUpsertInput!) {
  variableUpsert(input: $input)
}

# Obtenir les infos de déploiement
query Service($id: String!) {
  service(id: $id) {
    deployments(first: 1) {
      edges {
        node {
          url
        }
      }
    }
  }
}
```

## Coûts Railway

- **Hobby Plan**: $5/mois (500h compute)
- **Pro Plan**: $20/mois (usage-based)
- Chaque service généré consomme du temps de compute
- Monitoring via Railway dashboard

## Prochaines étapes

- [ ] Configurer RAILWAY_TOKEN sur le build-server
- [ ] Configurer RAILWAY_PROJECT_ID
- [ ] Tester avec une app todo list
- [ ] Vérifier que l'API répond sur Railway
- [ ] Vérifier que le frontend se connecte à l'API
- [ ] Monitorer les coûts Railway
