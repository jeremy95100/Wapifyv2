# Wapify - Architecture et Flow Complet

Ce document décrit le flow complet de génération, build et déploiement d'une application React dans Wapify.

## Table des matières
- [Vue d'ensemble de l'architecture](#vue-densemble-de-larchitecture)
- [Flow de génération](#flow-de-génération)
- [Flow de build et déploiement](#flow-de-build-et-déploiement)
- [Flow de rebuild](#flow-de-rebuild)
- [Points critiques et timing](#points-critiques-et-timing)
- [Configuration requise](#configuration-requise)

---

## Vue d'ensemble de l'architecture

```
┌─────────────────┐
│   Next.js App   │  (Vercel)
│   wapify.app    │
└────────┬────────┘
         │
         ├──► Supabase (DB + Storage)
         │    - projects table
         │    - project-files bucket
         │
         └──► Build Server (Railway)
              - BullMQ job queue
              - Vite builds
              - Upload to Vercel Blob
```

### Composants

1. **Frontend Next.js** (Vercel)
   - Interface utilisateur
   - API routes (`/api/*`)
   - Proxy preview (`/api/preview/*`)

2. **Build Server** (Railway)
   - Worker BullMQ
   - Build Vite
   - Upload Vercel Blob

3. **Supabase**
   - PostgreSQL database
   - Storage pour fichiers source

4. **Vercel Blob**
   - CDN pour apps buildées

5. **Redis** (Upstash)
   - Queue BullMQ

---

## Flow de Génération

### Étape 1 : Génération du code par Claude AI

```
User écrit prompt
     │
     ▼
/api/generate (POST)
     │
     ├──► Anthropic Claude API (streaming)
     │    - Génère les fichiers React
     │    - Instructions du prompt (lib/react-generator.ts)
     │
     └──► Retourne stream de fichiers
          {path, content, type}
```

**Temps moyen :** 15-45 secondes (selon complexité)

**Points critiques :**
- ⏱️ `maxDuration: 300` sur `/api/generate` (timeout 5 min)
- 📝 Claude suit les instructions dans `lib/react-generator.ts`
- ✅ Vérifier que le prompt contient toutes les règles (vite.config, package.json, etc.)

---

### Étape 2 : Sauvegarde dans Supabase

```
Fichiers générés
     │
     ▼
/api/projects (POST)
     │
     ├──► Supabase DB: INSERT projects
     │    - id, name, prompt, framework, user_id
     │    - status: 'generating'
     │    - storage_path: {userId}/{projectId}
     │
     └──► Supabase Storage: UPLOAD files
          - Bucket: project-files
          - Path: {userId}/{projectId}/{filename}
```

**Temps moyen :** 2-5 secondes

**Points critiques :**
- 📁 `storage_path` DOIT être défini (requis pour rebuild)
- ✅ Tous les fichiers uploadés avant de passer à l'étape suivante
- 🔒 Service role key pour bypass RLS

**Code key :**
```typescript
// app/api/projects/route.ts
const { data: project } = await supabase.from('projects').insert({
  id: projectId,
  user_id: userId,
  storage_path: `${userId}/${projectId}`,
  status: 'generating',
  framework: 'react'
})

// Upload files
for (const file of files) {
  await supabase.storage
    .from('project-files')
    .upload(`${userId}/${projectId}/${file.path}`, file.content)
}
```

---

## Flow de Build et Déploiement

### Étape 3 : Déclenchement du build

```
Frontend détecte fin de génération
     │
     ▼
/api/build (POST)
     │
     ├──► Build Server: /api/build
     │    {projectId, files, projectName}
     │
     └──► BullMQ: Add job to queue
          Job ID retourné
```

**Temps moyen :** <1 seconde (juste pour ajouter à la queue)

**Points critiques :**
- 🔄 Les `files` sont passés directement (pas re-téléchargés)
- 📊 Job ID retourné pour polling du status

---

### Étape 4 : Build sur Railway

```
BullMQ Worker traite le job
     │
     ▼
1. Créer dossier temp: /app/builds/{buildId}
     │
     ▼
2. Écrire tous les fichiers
     │
     ▼
3. npm install --legacy-peer-deps
   ⏱️ 10-20 secondes
     │
     ▼
4. npm run build (Vite)
   ⏱️ 3-6 secondes
     │
     ▼
5. Upload dist/ vers Vercel Blob
   ⏱️ 2-5 secondes
     │
     ▼
6. Cleanup /app/builds/{buildId}
     │
     ▼
Retourner URL
```

**Temps total moyen :** 15-30 secondes

**Points critiques :**

#### npm install
- ⏱️ Timeout : 120 secondes (2 min)
- 🔧 `--legacy-peer-deps` pour éviter les conflits
- ⚠️ Peut échouer si registry npm lent

#### npm run build
- ⏱️ Timeout : 120 secondes (2 min)
- ✅ DOIT être `"build": "vite build"` (pas `tsc &&`)
- 📋 Vite charge `vite.config.ts` (priorité sur `.js`)

#### Upload Vercel Blob
```typescript
// build-server/src/builder.js
await put(`${projectId}/${buildId}/${pathname}`, content, {
  access: 'public',
  addRandomSuffix: false,
  contentType: getContentType(pathname),
  contentDisposition: 'inline'  // ← Ignoré pour HTML
})
```

**URL générée :**
```
https://ljs2rmlzsjqpruaa.public.blob.vercel-storage.com/
  {projectId}/{buildId}/index.html
```

---

### Étape 5 : Affichage via proxy

```
Frontend reçoit URL Blob
     │
     ▼
Convertit en URL proxy
     │
     ▼
/api/preview/{projectId}/{buildId}/index.html
     │
     ├──► Fetch depuis Vercel Blob
     │
     └──► Re-serve avec:
          Content-Type: text/html
          Content-Disposition: inline  ← FORCE
```

**Temps moyen :** <500ms (première requête), <50ms (cache)

**Points critiques :**
- 🔒 Vercel Blob force `attachment` pour HTML (sécurité)
- 🔄 Proxy nécessaire pour afficher dans le navigateur
- 💾 Cache CDN pour performance

---

## Flow de Rebuild

### Quand utiliser le rebuild ?

- ✅ Après modification manuelle des fichiers dans Supabase
- ✅ Pour tester une correction sans regénérer tout le projet
- ✅ Quand le build précédent a échoué

### Flow du rebuild

```
User clique "🔄 Réessayer"
     │
     ▼
/api/projects/{id}/rebuild (POST)
     │
     ├──► Supabase DB: SELECT project
     │
     ├──► Supabase Storage: DOWNLOAD fichiers frais
     │    ⚠️ BYPASS le cache de 2 minutes
     │
     ├──► Build Server: /api/build
     │    {projectId, files (fresh), projectName}
     │
     └──► [Même flow que build initial]
```

**Différence clé :**
```typescript
// ❌ GET /api/projects/{id} → Utilise cache (2 min)
// ✅ POST /api/projects/{id}/rebuild → Fichiers frais toujours
```

---

## Points critiques et timing

### Temps d'attente normaux

| Opération | Temps | Maximum |
|-----------|-------|---------|
| Génération Claude AI | 15-45s | 5 min |
| Sauvegarde Supabase | 2-5s | 10s |
| Ajout job queue | <1s | 2s |
| npm install | 10-20s | 2 min |
| npm run build | 3-6s | 2 min |
| Upload Blob | 2-5s | 10s |
| **Total (génération → preview)** | **30-80s** | **~10 min** |

### Problèmes récurrents de déploiement

#### Railway auto-deploy

**Symptôme :** Build-server ne redémarre pas après un push

**Causes possibles :**
1. Webhook GitHub → Railway non déclenché
2. Railway en mode "Manual deploy"
3. Cache Docker ancien

**Solution :**
```bash
# Option 1: Commit vide
git commit --allow-empty -m "Trigger Railway deploy"
git push

# Option 2: Modifier un fichier
echo "# $(date)" >> build-server/README.md
git add build-server/README.md && git commit -m "Trigger deploy" && git push

# Option 3: Railway Dashboard → Redeploy
```

**Vérification :**
- Railway Dashboard → Deployments → Commit SHA
- Logs Railway → "Starting Container" timestamp

---

#### Vercel auto-deploy

**Symptôme :** Frontend ne se met pas à jour après un push

**Solution :**
```bash
# Commit vide pour forcer
git commit --allow-empty -m "Force Vercel redeploy"
git push
```

**Vérification :**
- Vercel Dashboard → Deployments → Source commit
- Attendre 1-3 minutes pour déploiement

---

### Cache et invalidation

#### Cache dans `/api/projects/[id]`

```typescript
// ⏱️ Durée : 2 minutes
const CACHE_DURATION = 2 * 60 * 1000

// Quand utilisé ?
- GET /api/projects/{id} ← Utilise cache
- POST /api/projects/{id}/rebuild ← BYPASS cache
```

**Impact :**
- ✅ Performance : Chargement rapide des projets
- ⚠️ Modifications manuelles : Utiliser rebuild pour fichiers frais

---

#### Cache CDN Vercel Blob

```
Cache-Control: public, max-age=31536000, immutable
```

**Impact :**
- ✅ Chaque `buildId` est unique → Pas de problème de cache
- ✅ URL différente à chaque rebuild

---

## Configuration requise

### Variables d'environnement Frontend (Vercel)

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhb...
SUPABASE_SERVICE_ROLE_KEY=eyJhb...  # ⚠️ Secret
ANTHROPIC_API_KEY=sk-ant-...  # ⚠️ Secret
BUILD_SERVER_URL=https://wapify-production.up.railway.app
```

### Variables d'environnement Build-server (Railway)

```bash
# Railway variables
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhb...  # ⚠️ Secret
BLOB_READ_WRITE_TOKEN=vercel_blob_...  # ⚠️ Secret
REDIS_URL=redis://...  # BullMQ
PORT=8080
```

### Fichiers de config critiques

#### Frontend
- `app/api/generate/route.ts` → `maxDuration: 300`
- `app/api/build/route.ts` → Envoie jobs au build-server
- `app/api/projects/[id]/rebuild/route.ts` → Bypass cache
- `app/api/preview/[...path]/route.ts` → Proxy Vercel Blob
- `lib/react-generator.ts` → Instructions Claude AI

#### Build-server
- `src/builder.js` → getContentType(), contentDisposition
- `src/queue.js` → BullMQ worker config
- `src/index.js` → Express server

---

## Monitoring et Debug

### Logs à surveiller

#### Frontend (Vercel)
```
Logs → Functions → Filtrer par :
- /api/generate
- /api/build
- /api/projects/*/rebuild
```

#### Build-server (Railway)
```
Logs → Build logs + Runtime logs

Chercher :
- "Starting Container" → Démarrage
- "Build completed for {id}" → Succès
- "Build failed" → Erreur
- "Uploaded: index.html (text/html)" → Upload OK
```

### Commandes de debug utiles

```bash
# Vérifier un projet
npx tsx check-project.js {projectId}

# Télécharger un fichier pour inspection
npx tsx download-file.js {projectId} vite.config.ts
npx tsx download-file.js {projectId} package.json

# Lister tous les fichiers
npx tsx list-all-project-files.js {projectId}

# Tester un build local
npx tsx download-full-project.js {projectId} ./test-project
cd test-project
npm install
npm run build
npm run preview  # Test en local
```

---

## Checklist de déploiement

Avant de pousser des changements en production :

### Frontend (Vercel)
- [ ] Tests locaux : `npm run dev`
- [ ] Build test : `npm run build`
- [ ] TypeScript : `npx tsc --noEmit`
- [ ] Push vers GitHub
- [ ] Vérifier déploiement Vercel (1-3 min)
- [ ] Tester sur vercel.com (pas localhost)

### Build-server (Railway)
- [ ] Tests locaux : `node src/index.js`
- [ ] Vérifier les variables d'env Railway
- [ ] Push vers GitHub
- [ ] Vérifier déploiement Railway (1-3 min)
- [ ] Check logs "Starting Container"
- [ ] Test avec un rebuild

### Après déploiement
- [ ] Générer une nouvelle app de test
- [ ] Vérifier que le build passe
- [ ] Vérifier que l'app s'affiche dans le preview
- [ ] Tester le bouton rebuild

---

## Ressources

- [Wapify Troubleshooting](./TROUBLESHOOTING.md)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Railway Docs](https://docs.railway.app/)
- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [Vercel Blob](https://vercel.com/docs/storage/vercel-blob)
- [BullMQ](https://docs.bullmq.io/)
