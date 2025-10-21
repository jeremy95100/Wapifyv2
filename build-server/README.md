# Wapify Build Server

Serveur Node.js qui compile les projets React générés par Wapify avec Vite.

## Architecture

```
Frontend (Vercel)
      ↓
  AI génère code
      ↓
Build Server (Railway)
      ↓
  1. npm install
  2. vite build
  3. Upload to Blob
      ↓
User reçoit preview
```

## Installation locale

```bash
cd build-server
npm install
cp .env.example .env
# Configurer REDIS_URL et BLOB_READ_WRITE_TOKEN
npm run dev
```

## Déploiement sur Railway

### 1. Créer un nouveau projet Railway

1. Aller sur https://railway.app/dashboard
2. Cliquer "New Project"
3. Choisir "Deploy from GitHub repo"
4. Sélectionner ce repo et le dossier `/build-server`

### 2. Ajouter Redis au projet

1. Dans le projet Railway, cliquer "New"
2. Choisir "Database" → "Redis"
3. Railway va automatiquement créer la variable `REDIS_URL`

### 3. Configurer les variables d'environnement

Dans Railway → Variables:

```
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxx
```

### 4. Déployer

Railway va automatiquement:
- Installer les dépendances
- Démarrer le serveur
- Exposer une URL publique

## API Endpoints

### POST /api/build

Lance un build.

**Request:**
```json
{
  "projectId": "proj_abc123",
  "projectName": "My E-commerce",
  "files": [
    {
      "path": "package.json",
      "content": "..."
    },
    {
      "path": "src/App.jsx",
      "content": "..."
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "jobId": "123",
  "message": "Build job added to queue",
  "estimatedTime": "15-30 seconds"
}
```

### GET /api/build/:jobId

Récupère le statut d'un build.

**Response:**
```json
{
  "jobId": "123",
  "state": "completed",
  "progress": 100,
  "result": {
    "success": true,
    "url": "https://blob.vercel-storage.com/...",
    "files": [...]
  }
}
```

### GET /api/stats

Statistiques de la queue.

**Response:**
```json
{
  "queue": {
    "waiting": 2,
    "active": 3,
    "completed": 145,
    "failed": 5,
    "total": 5
  }
}
```

## Configuration

### Concurrency

Par défaut, 5 builds en parallèle. Pour changer:

Dans `src/queue.js`:
```js
concurrency: 10  // 10 builds en parallèle
```

### Timeouts

- npm install: 2 minutes max
- vite build: 2 minutes max

Pour changer, éditer `timeout` dans `src/builder.js`.

## Monitoring

Logs en temps réel sur Railway dashboard.

Pour des logs avancés, intégrer Better Stack (optionnel).

## Troubleshooting

### Build échoue avec "timeout"

Augmenter le timeout dans `builder.js`:
```js
timeout: 180000  // 3 minutes
```

### Redis connection failed

Vérifier que `REDIS_URL` est bien configurée.

Pour Railway Redis, le format est:
```
redis://default:password@redis.railway.internal:6379
```

### Out of memory

Augmenter la RAM du service Railway:
- Aller dans Settings → Resources
- Augmenter la RAM (8GB → 16GB)

## Coûts

- Railway: $5-20/mois selon usage
- Vercel Blob: $0.15/GB stocké
- Redis: Inclus dans Railway

Total estimé: $5-30/mois pour 100 users.
# Updated at mar. 21 oct. 2025 14:20:32 CEST
