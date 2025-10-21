# Wapify - Guide de Dépannage

Ce document liste tous les problèmes rencontrés durant le développement de Wapify et leurs solutions.

## Table des matières
- [Problèmes de Build](#problèmes-de-build)
- [Problèmes de Path Alias](#problèmes-de-path-alias)
- [Problèmes de Déploiement](#problèmes-de-déploiement)
- [Problèmes d'Affichage](#problèmes-daffichage)

---

## Problèmes de Build

### ❌ TypeScript bloque le build avec des erreurs mineures

**Symptômes :**
```
error TS6133: 'React' is declared but its value is never read
error TS2339: Property 'isDarkMode' does not exist on type 'CounterStore'
```

**Cause :** Claude AI générait `"build": "tsc && vite build"` dans package.json, causant le blocage sur des erreurs TypeScript non critiques.

**Solution :**
```typescript
// Dans lib/react-generator.ts, instructions au prompt Claude AI :
⚠️ PACKAGE.JSON BUILD SCRIPT (CRITIQUE):
- ❌ NE JAMAIS utiliser "build": "tsc && vite build"
- ✅ TOUJOURS utiliser "build": "vite build" UNIQUEMENT
- Raison: tsc bloque le build sur des erreurs TypeScript mineures
- Vite fait déjà la vérification TypeScript nécessaire pendant le build
```

**Impact :** ✅ Résolu - Les builds passent maintenant sans être bloqués par TypeScript

---

### ❌ Erreur : `Rollup failed to resolve import "@/lib/utils"`

**Symptômes :**
```
[vite]: Rollup failed to resolve import "@/lib/utils" from "src/components/Layout.tsx"
```

**Cause racine :** Plusieurs problèmes imbriqués :

1. **Manque de configuration path alias** dans vite.config
2. **`@types/node` manquant** dans devDependencies
3. **`__dirname` ne fonctionne pas en ESM** (type: "module")
4. **`process.cwd()` retourne le mauvais répertoire** lors du build

**Solutions appliquées (dans l'ordre) :**

#### 1. Ajouter `@types/node` au package.json
```typescript
// lib/react-generator.ts - generatePackageJSON()
const devDependencies: Record<string, string> = {
  "@types/node": "^20.10.0",  // ← AJOUTÉ
  "@vitejs/plugin-react": "^4.3.4",
  "vite": "^6.0.12",
  // ...
}
```

#### 2. Ajouter resolve.alias dans vite.config
```typescript
// lib/react-generator.ts - generateViteConfig()
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')  // ← AJOUTÉ
    }
  },
  // ...
})
```

**Pourquoi `fileURLToPath` au lieu de `process.cwd()` ?**
- En ESM (`"type": "module"`), `__dirname` n'existe pas
- `process.cwd()` retourne le répertoire courant d'exécution, pas le répertoire du fichier
- `fileURLToPath(import.meta.url)` donne le chemin absolu du fichier actuel

**Impact :** ✅ Résolu - Les imports `@/...` fonctionnent correctement

---

## Problèmes de Path Alias

### ❌ Deux fichiers vite.config (`.js` et `.ts`)

**Symptômes :**
- Build échoue avec erreur de path alias
- Modification du `vite.config.ts` ne résout rien

**Cause :** Vite peut charger `.js` ou `.ts` en priorité selon le contexte. Si les deux existent avec des configs différentes, comportement imprévisible.

**Solution :**
```bash
# Supprimer vite.config.js, garder uniquement vite.config.ts
supabase.storage.from('project-files').remove(['path/vite.config.js'])
```

**Impact :** ✅ Résolu - Un seul fichier de config = comportement prévisible

---

## Problèmes de Déploiement

### ❌ Vercel ne déploie pas automatiquement les derniers commits

**Symptômes :**
- Push sur GitHub réussi
- Vercel reste sur un ancien commit
- Redéploiement manuel utilise toujours l'ancien commit

**Cause :** Webhook GitHub → Vercel non déclenché ou problème de cache

**Solutions :**

#### Option 1 : Commit vide pour forcer le déploiement
```bash
git commit --allow-empty -m "Force Vercel redeploy to latest commit"
git push
```

#### Option 2 : Redéploiement manuel sur Vercel Dashboard
1. Aller sur vercel.com → projet
2. Deployments → trois points → Redeploy
3. Vérifier le commit SHA affiché

**Impact :** ✅ Résolu - Vercel déploie maintenant le bon commit

---

### ❌ Railway ne déploie pas le dernier code du build-server

**Symptômes :**
- Push réussi sur GitHub
- Railway container redémarre
- Mais le code exécuté est ancien (vérifiable dans les logs)

**Cause :** Railway a un cache Docker ou ne pull pas correctement depuis GitHub

**Solutions :**

#### Option 1 : Push d'un fichier pour forcer Railway
```bash
echo "# Updated at $(date)" >> build-server/README.md
git add build-server/README.md
git commit -m "Trigger Railway deploy"
git push
```

#### Option 2 : Redéploiement manuel sur Railway
1. Railway Dashboard → Service → Deployments
2. Vérifier le commit SHA
3. Si incorrect : Click "Deploy" → sélectionner le bon commit

**Impact :** ✅ Résolu - Railway déploie maintenant le bon code

---

### ❌ Cache de 2 minutes dans `/api/projects/[id]`

**Symptômes :**
- Modifications manuelles des fichiers dans Supabase Storage
- Rebuild utilise les anciens fichiers en cache
- Changements ignorés

**Cause :** Cache intentionnel dans l'API GET pour performance

```typescript
// app/api/projects/[id]/route.ts
const CACHE_DURATION = 2 * 60 * 1000 // 2 minutes

if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
  files = cached.files  // ← Utilise le cache
}
```

**Solution :** Endpoint dédié `/api/projects/[id]/rebuild`
```typescript
// app/api/projects/[id]/rebuild/route.ts
// TOUJOURS télécharge les fichiers frais depuis Storage (bypass cache)
const filesResult = await getProjectFiles(project.user_id, id)
```

**Impact :** ✅ Résolu - Rebuild utilise toujours les fichiers à jour

---

## Problèmes d'Affichage

### ❌ Chemins absolus dans le HTML généré

**Symptômes :**
```html
<!-- ❌ Mauvais : chemins absolus -->
<script src="/assets/index-xxx.js"></script>
<!-- Erreur 404 sur Vercel Blob -->
```

**Cause :** `vite.config` sans `base: './'`

**Solution :**
```typescript
// vite.config.ts
export default defineConfig({
  base: './',  // ← IMPORTANT: chemins relatifs
  // ...
})
```

**Résultat :**
```html
<!-- ✅ Bon : chemins relatifs -->
<script src="./assets/index-xxx.js"></script>
```

**Impact :** ✅ Résolu - Les assets se chargent correctement

---

### ❌ HTML se télécharge au lieu de s'afficher

**Symptômes :**
- L'URL du build télécharge `index.html` au lieu de l'afficher
- Même dans un nouvel onglet

**Cause :** Vercel Blob force `Content-Disposition: attachment` pour les fichiers HTML (sécurité XSS)

**Vérification :**
```bash
curl -I "https://...blob.vercel-storage.com/.../index.html"
# content-disposition: attachment; filename="index.html"  ← Problème
```

**Tentatives échouées :**

#### ❌ Tentative 1 : Ajouter `contentType` dans put()
```typescript
await put(pathname, content, {
  contentType: 'text/html; charset=utf-8'  // ← Pas suffisant
})
```
**Résultat :** Toujours `attachment`

#### ❌ Tentative 2 : Ajouter `contentDisposition: 'inline'`
```typescript
await put(pathname, content, {
  contentType: 'text/html; charset=utf-8',
  contentDisposition: 'inline'  // ← IGNORÉ par Vercel Blob
})
```
**Résultat :** Vercel Blob ignore ce paramètre pour HTML

**Documentation Vercel Blob :**
> Les types MIME autorisés pour `inline` sont : `text/plain`, `text/xml`, `application/json`, `application/pdf`, `image/*`, `audio/*`, `video/*`
>
> **`text/html` est EXCLU** et sera toujours servi avec `attachment`

**Solution finale :** Proxy côté serveur

```typescript
// app/api/preview/[...path]/route.ts
export async function GET(request, { params }) {
  // 1. Récupérer depuis Vercel Blob
  const blobUrl = `https://.../blob.vercel-storage.com/${path}`
  const response = await fetch(blobUrl)
  const content = await response.arrayBuffer()

  // 2. Re-servir avec Content-Disposition: inline
  return new NextResponse(content, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': 'inline',  // ← FORCE inline
    }
  })
}
```

**Usage :**
```typescript
// Convertir URL Blob → URL Proxy
const proxyUrl = convertToProxyUrl(blobUrl)
// https://.../blob.vercel-storage.com/... → /api/preview/...
```

**Impact :** ✅ Résolu - Les apps s'affichent dans le navigateur

---

## Problèmes Récurrents

### ⚠️ Railway auto-deploy aléatoire

**Symptôme :** Railway ne détecte pas toujours les pushes GitHub

**Solution temporaire :** Push un commit vide ou redéployer manuellement

**À investiguer :** Vérifier les webhooks GitHub → Railway

---

### ⚠️ Vercel auto-deploy parfois lent

**Symptôme :** Vercel prend 3-5 minutes pour détecter un push

**Solution :** Attendre ou forcer avec un commit vide

---

## Checklist de Debug

Quand un build échoue, vérifier dans l'ordre :

1. ✅ Le build-server Railway a-t-il le bon commit ?
2. ✅ Le frontend Vercel a-t-il le bon commit ?
3. ✅ Le `package.json` a-t-il `"build": "vite build"` (sans tsc) ?
4. ✅ Le `vite.config.ts` a-t-il `base: './'` ?
5. ✅ Le `vite.config.ts` a-t-il `resolve.alias` avec `fileURLToPath` ?
6. ✅ Le `package.json` a-t-il `@types/node` ?
7. ✅ Les fichiers existent-ils dans Supabase Storage ?
8. ✅ Le rebuild utilise-t-il `/api/projects/[id]/rebuild` (fichiers frais) ?

---

## Scripts Utiles Créés

Pendant le debug, ces scripts ont été créés (dans `/home/mgali/wapify/`) :

- `check-project.js` - Vérifie l'état d'un projet dans Supabase
- `download-file.js` - Télécharge un fichier depuis Supabase Storage
- `download-full-project.js` - Télécharge tous les fichiers d'un projet
- `list-all-project-files.js` - Liste tous les fichiers récursivement
- `fix-*.js` - Scripts de correction manuelle (vite.config, package.json, etc.)
- `trigger-rebuild.js` - Déclenche un rebuild manuellement

**Usage :**
```bash
npx tsx check-project.js <project-id>
npx tsx download-file.js <project-id> <filename>
npx tsx list-all-project-files.js <project-id>
```

---

## Ressources

- [Vite Config Reference](https://vitejs.dev/config/)
- [Vercel Blob Docs](https://vercel.com/docs/storage/vercel-blob)
- [ESM __dirname Alternative](https://nodejs.org/api/esm.html#no-__filename-or-__dirname)
