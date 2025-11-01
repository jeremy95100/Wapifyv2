# Guide de Déploiement - Architecture Multitenant

## 🎯 Vue d'ensemble

Wapify utilise maintenant une **architecture multitenant scalable** :
- 1 API partagée pour TOUTES les apps
- 1 base de données partagée pour TOUTES les apps
- Isolation des données via `project_id`

**Économies : $500+/mois → $25/mois pour 100 apps (95%)**

---

## 📋 Prérequis

- Compte Neon (database)
- Compte Railway (API hosting)
- Compte GitHub (code hosting)
- Variables d'environnement actuelles (ANTHROPIC_API_KEY, GITHUB_TOKEN, etc.)

---

## 🚀 Étapes de Déploiement

### Étape 1 : Créer la Base de Données Neon Partagée

1. Aller sur [Neon Console](https://console.neon.tech)
2. Créer un nouveau projet : **wapify-shared-db**
3. Copier la connection string (format : `postgresql://user:password@host/db`)
4. Garder pour l'étape 3

### Étape 2 : Déployer l'API Partagée sur Railway

```bash
# Dans votre terminal local
cd shared-api
```

1. Aller sur [Railway Dashboard](https://railway.com)
2. Cliquer sur "New Project" → "Deploy from GitHub repo"
3. Sélectionner le repo `wapify`
4. Dans "Service Settings" :
   - **Root Directory**: `shared-api`
   - **Start Command**: `npm start` (ou laisser par défaut)

5. Ajouter les variables d'environnement :
   ```bash
   DATABASE_URL=postgresql://user:password@host/db
   PORT=3001
   NODE_ENV=production
   ```

6. Cliquer sur "Deploy"
7. Une fois déployé, copier l'URL du service (ex: `https://wapify-shared-api.up.railway.app`)

### Étape 3 : Configurer le Build Server

Dans Railway, allez dans le service **build-server** :

1. Aller dans "Variables"
2. Ajouter les nouvelles variables :

```bash
# Shared Database (nouveau)
SHARED_DATABASE_URL=postgresql://user:password@host/db
SHARED_NEON_PROJECT_ID=<votre_neon_project_id>

# Shared API URL (nouveau)
SHARED_API_URL=https://wapify-shared-api.up.railway.app

# Garder les anciennes variables pour backward compatibility
NEON_API_KEY=<votre_neon_api_key>
GITHUB_TOKEN=<votre_github_token>
ANTHROPIC_API_KEY=<votre_anthropic_key>
REDIS_URL=<votre_redis_url>
```

3. Redémarrer le service

### Étape 4 : Initialiser la Base de Données

Connectez-vous à votre base Neon et exécutez :

```sql
-- Table de registre des projets
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Les autres tables seront créées automatiquement lors de la génération
```

---

## ✅ Vérification

### Test 1 : Vérifier l'API Partagée

```bash
curl https://wapify-shared-api.up.railway.app/health
```

Réponse attendue :
```json
{
  "status": "ok",
  "timestamp": "2025-01-25T10:00:00.000Z",
  "service": "wapify-shared-api",
  "version": "1.0.0"
}
```

### Test 2 : Vérifier la Base de Données

Dans Neon Console, vérifier que la table `projects` existe.

### Test 3 : Générer une App de Test

1. Aller sur Wapify
2. Générer une app (ex: "Une todo list simple")
3. Vérifier dans les logs Railway :
   ```
   📦 Using shared multitenant database
   ✅ Tables created in shared database
   ✓ Frontend configuré avec l'API partagée
   ```

4. Vérifier dans Neon Console :
   - Table `tasks` créée
   - Colonne `project_id` présente
   - Index `idx_tasks_project_id` créé

5. Vérifier dans GitHub :
   - Repo créé
   - Fichier `.env.production` avec :
     ```
     VITE_API_URL=https://wapify-shared-api.up.railway.app
     VITE_PROJECT_ID=proj-xxxxxx
     ```

### Test 4 : Tester l'API

```bash
# Remplacer PROJECT_ID par celui de votre app
PROJECT_ID="proj-xxxxxx"

# Tester GET (devrait retourner [])
curl https://wapify-shared-api.up.railway.app/api/$PROJECT_ID/tasks

# Tester POST
curl -X POST https://wapify-shared-api.up.railway.app/api/$PROJECT_ID/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Test task","completed":false}'

# Tester GET again (devrait retourner 1 task)
curl https://wapify-shared-api.up.railway.app/api/$PROJECT_ID/tasks
```

---

## 🔧 Dépannage

### Erreur : "SHARED_DATABASE_URL not configured"

**Cause** : Variable d'environnement manquante sur le build-server

**Solution** :
1. Aller dans Railway → build-server → Variables
2. Ajouter `SHARED_DATABASE_URL`
3. Redémarrer le service

### Erreur : "relation 'tasks' does not exist"

**Cause** : Tables pas encore créées

**Solution** :
- Première génération crée automatiquement les tables
- Ou exécuter le SQL d'initialisation manuellement

### Erreur : "Connection refused" sur l'API

**Cause** : Service shared-api pas déployé ou crashé

**Solution** :
1. Vérifier que le service est "running" dans Railway
2. Checker les logs Railway pour erreurs
3. Vérifier que `DATABASE_URL` est correctement configuré

### Les données ne sont pas isolées

**Cause** : Frontend n'utilise pas PROJECT_ID dans les URLs

**Solution** :
- Vérifier que `.env.production` contient `VITE_PROJECT_ID`
- Vérifier que le code frontend utilise :
  ```javascript
  const PROJECT_ID = import.meta.env.VITE_PROJECT_ID
  fetch(`${API_URL}/api/${PROJECT_ID}/tasks`)
  ```

---

## 📊 Monitoring

### Surveiller les Coûts

**Railway** :
- Dashboard → Usage
- Objectif : <$50/mois total

**Neon** :
- Dashboard → Usage
- Objectif : <1GB storage

### Surveiller les Performances

**Requêtes SQL lentes** :
```sql
SELECT * FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

**Nombre de projets** :
```sql
SELECT COUNT(*) FROM projects;
```

**Distribution des données** :
```sql
SELECT
  'tasks' as table_name,
  COUNT(*) as total_rows,
  COUNT(DISTINCT project_id) as projects_count
FROM tasks;
```

---

## 🔄 Migration des Apps Existantes

Si vous avez des apps qui utilisent l'ancienne architecture (per-branch) :

### Option 1 : Cohabitation (Recommandé)

- Nouvelles apps → Architecture multitenant
- Anciennes apps → Continuent avec branches
- Pas de migration nécessaire

Le code supporte les deux automatiquement.

### Option 2 : Migration Complète

Voir `NEON_MULTITENANT_SETUP.md` section "Migration from Old Architecture"

---

## 📈 Scalabilité

### Limites Actuelles

- **Neon Free** : 512MB storage
  - ~10,000 tasks ou ~5,000 products
  - Upgrade à Neon Pro ($19/mo) pour 10GB

- **Railway Hobby** : $5/mois
  - 500h compute/mois
  - 1 service = 720h/mois → Need Pro ($20/mo)

- **API Performance** :
  - 1 instance = ~1000 req/s
  - Scale horizontalement si besoin

### Quand Scaler ?

**Neon** :
- >80% storage utilisé → Upgrade to Pro
- Requêtes lentes (>1s) → Optimiser index

**Railway** :
- CPU >80% sustained → Add more replicas
- Memory >80% → Increase resources

---

## 🎉 Résumé

Une fois déployé, vous aurez :

✅ **1 API partagée** qui sert toutes les apps
✅ **1 database partagée** avec isolation par project_id
✅ **GitHub deployments** automatiques
✅ **Coûts fixes** ~$25-50/mois pour apps illimitées
✅ **Architecture scalable** jusqu'à millions d'utilisateurs

---

## 📚 Documentation Complémentaire

- [ARCHITECTURE_SCALABILITY.md](ARCHITECTURE_SCALABILITY.md) - Analyse complète
- [NEON_MULTITENANT_SETUP.md](NEON_MULTITENANT_SETUP.md) - Guide Neon détaillé
- [shared-api/README.md](shared-api/README.md) - Documentation API
- [RAILWAY_SETUP.md](RAILWAY_SETUP.md) - Configuration Railway (legacy)

---

**Besoin d'aide ?** Consultez les logs Railway ou créez une issue GitHub.

🚀 **Prêt à déployer !**
