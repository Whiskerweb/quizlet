# 🔧 Fix Erreur Vercel : "No such file or directory"

## Problème

Vercel ne trouve pas le répertoire `apps/web` car le **Root Directory** n'est pas configuré dans l'interface Vercel.

## ✅ Solution : Configurer le Root Directory dans Vercel

### Option 1 : Via l'interface Vercel (Recommandé)

1. **Allez dans votre projet Vercel**
2. **Settings** → **General**
3. Dans la section **"Root Directory"**, cliquez sur **"Edit"**
4. Sélectionnez : `apps/web`
5. **Save**
6. **Redéployez** (ou faites un nouveau push)

### Option 2 : Via le Dashboard lors de l'import

Si vous créez un nouveau projet :

1. Lors de l'import du repo, dans **"Configure Project"**
2. Trouvez **"Root Directory"**
3. Cliquez sur **"Edit"**
4. Tapez : `apps/web`
5. Continuez avec le déploiement

## 📝 Configuration Vercel complète

Une fois le Root Directory configuré, Vercel devrait détecter automatiquement :
- ✅ Framework : Next.js
- ✅ Build Command : `pnpm build` (exécuté depuis `apps/web`)
- ✅ Output Directory : `.next`
- ✅ Install Command : `pnpm install`

## 🔄 Après configuration

1. **Faites un nouveau push** ou **redéployez** depuis Vercel
2. Le build devrait maintenant fonctionner !

## ⚠️ Note

Le fichier `vercel.json` à la racine est pour la configuration globale, mais Vercel a besoin que le **Root Directory** soit configuré dans l'interface pour savoir où chercher le projet Next.js.

---

**Une fois le Root Directory configuré, tout devrait fonctionner !** 🚀










