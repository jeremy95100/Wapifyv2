# Guide de Déploiement - Wapify avec Vite Build System

Ce guide explique comment déployer l'architecture complète de Wapify avec le système de build Vite.

---

## 📋 PRÉREQUIS

Comptes créés :
- ✅ Vercel (frontend)
- ✅ Railway (build server)
- ✅ Anthropic (AI)
- ✅ Supabase (auth/storage)
- ✅ Neon (databases)

---

## 🚀 ÉTAPE 1: Déployer le Build Server sur Railway

### 1.1 Créer un nouveau projet Railway

1. Aller sur https://railway.app/dashboard
2. Cliquer **"New Project"**
3. Choisir **"Deploy from GitHub repo"**
4. Connecter ton compte GitHub si ce n'est pas fait
5. Sélectionner le repo **Wapify**
6. **IMPORTANT**: Dans "Root Directory", mettre `/build-server`
7. Cliquer **"Deploy"**

### 1.2 Ajouter Redis au projet

1. Dans le projet Railway, cliquer **"New"** → **"Database"** → **"Add Redis"**
2. Railway va automatiquement créer la variable `REDIS_URL`
3. Attendre que Redis soit déployé (1-2 minutes)

### 1.3 Obtenir le token Vercel Blob

1. Aller sur https://vercel.com/dashboard
2. Cliquer sur ton projet Wapify
3. Aller dans **"Storage"** → **"Create Database"** → **"Blob"**
4. Créer un store "wapify-builds"
5. Aller dans **"Settings"** → **".env.local"**
6. Copier la valeur de `BLOB_READ_WRITE_TOKEN`

### 1.4 Configurer les variables d'environnement Railway

Dans Railway → Ton projet → **Variables**, ajouter :

```
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxxxx
```

**Note**: `REDIS_URL` et `PORT` sont déjà auto-configurés par Railway

### 1.5 Déployer

Railway va automatiquement :
- Détecter le `package.json`
- Installer les dépendances (`npm install`)
- Démarrer le serveur (`npm start`)

Attendre 2-3 minutes que le déploiement soit terminé.

### 1.6 Obtenir l'URL du build server

1. Dans Railway → Settings → **"Generate Domain"**
2. Copier l'URL (ex: `wapify-build-server.up.railway.app`)
3. **Note importante**: Garde cette URL, on en a besoin pour le frontend

---

## 🌐 ÉTAPE 2: Déployer le Frontend sur Vercel

### 2.1 Connecter le repo GitHub

1. Aller sur https://vercel.com/dashboard
2. Cliquer **"Add New"** → **"Project"**
3. Sélectionner le repo **Wapify**
4. **IMPORTANT**: Root Directory doit être `/` (pas `/build-server`)
5. **NE PAS DÉPLOYER ENCORE** - on doit d'abord configurer les variables

### 2.2 Configurer les variables d'environnement

Dans Vercel → Project Settings → **Environment Variables**, ajouter :

```bash
# AI
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxx

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Neon
NEON_API_KEY=xxxxxxxxxxxxxx
NEON_PROJECT_ID=xxx-xxx-xxx

# Build Server (l'URL Railway de l'étape 1.6)
BUILD_SERVER_URL=https://wapify-build-server.up.railway.app

# Vercel Blob (déjà configuré automatiquement)
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxx
```

### 2.3 Déployer

1. Cliquer **"Deploy"**
2. Attendre 2-3 minutes
3. Vérifier que le déploiement est réussi

---

## 🧪 ÉTAPE 3: Tester le système complet

### 3.1 Test du build server

Ouvrir un terminal et tester l'API :

```bash
# Health check
curl https://wapify-build-server.up.railway.app/health

# Devrait retourner:
# {"status":"ok","service":"wapify-build-server"}
```

### 3.2 Test du frontend

1. Aller sur ton URL Vercel (ex: `wapify.vercel.app`)
2. Se connecter
3. Créer une nouvelle app (ex: "Un e-commerce de vêtements")
4. **Observer** :
   - L'AI génère le code (10-20 secondes)
   - Le build démarre (15-30 secondes avec progress bar)
   - La preview s'affiche avec toutes les dépendances fonctionnelles

### 3.3 Vérifier que les dépendances fonctionnent

Créer une app qui utilise des dépendances interdites avec Sandpack :

**Test 1: App avec graphiques**
```
Crée-moi un dashboard avec des graphiques de ventes utilisant recharts
```

**Vérifier** : Les graphiques recharts s'affichent correctement ✅

**Test 2: App avec dates**
```
Crée-moi un calendrier d'événements avec date-fns
```

**Vérifier** : Les dates sont bien formatées avec date-fns ✅

**Test 3: App e-commerce**
```
Crée-moi une boutique en ligne avec panier et checkout
```

**Vérifier** : Tout fonctionne sans erreurs Sandpack ✅

---

## 📊 ÉTAPE 4: Monitoring

### 4.1 Logs Railway (Build Server)

1. Aller sur Railway → Ton projet → **"Deployments"**
2. Cliquer sur le dernier déploiement
3. Onglet **"Logs"** pour voir les logs en temps réel

**Logs importants à surveiller** :
```
🚀 Wapify Build Server running on port 3001
🔧 Setting up build queue...
✅ Build queue ready (concurrency: 5)
🔨 Starting build for project: xxx
✅ Build completed for xxx
```

### 4.2 Logs Vercel (Frontend)

1. Aller sur Vercel → Project → **"Logs"**
2. Filtrer par "Runtime Logs"

### 4.3 Stats de la queue

Tester l'endpoint stats :

```bash
curl https://wapify-build-server.up.railway.app/api/stats

# Retourne:
# {
#   "queue": {
#     "waiting": 0,
#     "active": 1,
#     "completed": 15,
#     "failed": 0,
#     "total": 1
#   }
# }
```

---

## 🔧 TROUBLESHOOTING

### Problème: Build timeout

**Symptôme** : Build échoue après 2 minutes

**Solution** :
1. Dans Railway, aller dans Settings → Resources
2. Augmenter la RAM (8GB → 16GB)
3. Ou augmenter le timeout dans `build-server/src/builder.js`:
```js
timeout: 180000  // 3 minutes au lieu de 2
```

### Problème: Redis connection error

**Symptôme** : `Error: connect ECONNREFUSED`

**Solution** :
1. Vérifier que Redis est bien déployé sur Railway
2. Vérifier que `REDIS_URL` est auto-configurée
3. Redémarrer le build server

### Problème: Vercel Blob upload fails

**Symptôme** : `Error: Unauthorized`

**Solution** :
1. Vérifier que `BLOB_READ_WRITE_TOKEN` est bien configuré
2. Régénérer le token sur Vercel si nécessaire
3. Mettre à jour la variable sur Railway

### Problème: Frontend ne peut pas contacter build server

**Symptôme** : `Failed to trigger build`

**Solution** :
1. Vérifier que `BUILD_SERVER_URL` est bien configuré dans Vercel
2. Vérifier que l'URL Railway est accessible (pas en maintenance)
3. Vérifier les CORS dans `build-server/src/index.js`

---

## 💰 COÛTS ESTIMÉS

Avec cette configuration :

```
Railway (Build Server + Redis)  → $5-20/mois
Vercel (Frontend + Blob)        → $0-20/mois (Hobby puis Pro)
───────────────────────────────────────────
TOTAL:                             $5-40/mois
```

**Pour 100 utilisateurs actifs** : ~$50-100/mois
**Pour 500 utilisateurs actifs** : ~$200-400/mois

---

## 🎯 NEXT STEPS

Une fois que tout fonctionne :

1. **Optimiser les coûts AI** :
   - Implémenter le prompt caching Anthropic
   - Utiliser Haiku pour les apps simples

2. **Améliorer l'UX** :
   - Progress bar détaillée pendant le build
   - Preview des logs de build en temps réel
   - Retry automatique si build échoue

3. **Monitoring avancé** (optionnel) :
   - Ajouter Better Stack pour les logs centralisés
   - Ajouter des alertes si build échoue
   - Dashboard de stats (temps de build moyen, taux de succès, etc.)

4. **Scaling** :
   - Passer à Upstash Redis si >100 users
   - Augmenter la concurrency si besoin (5 → 10 builds parallèles)
   - Ajouter du caching pour les dépendances npm répétées

---

## 📚 RESSOURCES

- Railway Docs: https://docs.railway.app
- Vercel Blob: https://vercel.com/docs/storage/vercel-blob
- BullMQ: https://docs.bullmq.io

---

**Dernière mise à jour** : 2025-10-18

**Status** : ✅ Prêt pour déploiement
