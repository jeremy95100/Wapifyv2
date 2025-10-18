# Configuration des variables d'environnement Vercel

## 🚨 ERREUR ACTUELLE
**Erreur:** `https://wapify.vercel.app/auth/error?error=Configuration`

**Cause:** Variables NextAuth manquantes sur Vercel

---

## ✅ SOLUTION: Ajouter les variables manquantes

### 1. Aller sur le dashboard Vercel
🔗 https://vercel.com/wapify-app/wapify/settings/environment-variables

### 2. Ajouter ces 2 variables OBLIGATOIRES:

#### Variable 1: NEXTAUTH_URL
- **Name:** `NEXTAUTH_URL`
- **Value:** `https://wapify.vercel.app`
- **Environments:** ✅ Production, ✅ Preview, ✅ Development

#### Variable 2: NEXTAUTH_SECRET
- **Name:** `NEXTAUTH_SECRET`
- **Value:** `4NHhMUCVH/sF71NWZ8yjVZxoRL1oBAKSrs2Y7GFbFW8=`
- **Environments:** ✅ Production, ✅ Preview, ✅ Development

---

## 📋 Variables existantes (à vérifier)

Assurez-vous que ces variables sont déjà présentes:

1. ✅ `ANTHROPIC_API_KEY`
2. ✅ `NEXT_PUBLIC_SUPABASE_URL` = `https://ontqgofmtqkpgvpvhvqa.supabase.co`
3. ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
4. ✅ `SUPABASE_SERVICE_ROLE_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
5. ✅ `NEON_API_KEY`
6. ✅ `NEON_PROJECT_ID` = `young-wave-15657561`
7. ✅ `BUILD_SERVER_URL` = `https://wapify-production.up.railway.app`
8. ✅ `BLOB_READ_WRITE_TOKEN` = `vercel_blob_rw_ljS2rMLzsjqpruaa_4E8sL53Yu7vhOe37UXPnrFZ8ucNlG4`

---

## 🔄 Après avoir ajouté les variables

### Option 1: Redéploiement automatique (recommandé)
Vercel redéploiera automatiquement dès que vous ajoutez les variables.

### Option 2: Redéploiement manuel
Si ça ne redéploie pas automatiquement:
1. Aller sur: https://vercel.com/wapify-app/wapify/deployments
2. Cliquer sur le dernier déploiement
3. Cliquer sur "⋯" (trois points) → "Redeploy"

---

## 🧪 Test après redéploiement

1. Aller sur: https://wapify.vercel.app/auth/signin
2. Cliquer sur "Pas encore de compte ? Inscrivez-vous"
3. Remplir:
   - **Nom:** Test User
   - **Email:** test@wapify.app
   - **Password:** test123
4. Cliquer sur "Créer mon compte"

✅ **Résultat attendu:** Compte créé et redirection vers `/editor`

❌ **Si erreur persiste:** Vérifier les logs Vercel:
https://vercel.com/wapify-app/wapify/logs

---

## 📝 Google OAuth (OPTIONNEL)

Si vous voulez activer la connexion Google:

1. Créer un projet sur: https://console.cloud.google.com/
2. Activer Google OAuth API
3. Créer des credentials OAuth 2.0:
   - **Authorized redirect URIs:** `https://wapify.vercel.app/api/auth/callback/google`
4. Ajouter sur Vercel:
   - `GOOGLE_CLIENT_ID` = `xxx.apps.googleusercontent.com`
   - `GOOGLE_CLIENT_SECRET` = `GOCSPX-xxx`

**Note:** Pour l'instant, vous pouvez utiliser uniquement l'inscription email/password (Supabase Auth).
