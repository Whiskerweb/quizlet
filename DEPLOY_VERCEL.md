# 🚀 Déploiement sur Vercel - Guide Complet

## ✅ Prérequis

- ✅ Compte GitHub avec le repo `Whiskerweb/quizlet`
- ✅ Compte Vercel (gratuit) : https://vercel.com/signup
- ✅ Projet Supabase créé et configuré

## 📋 Étape 1 : Vérifier que tout est sur GitHub

```bash
git add -A
git commit -m "Fix: Dashboard layout and Supabase integration"
git push
```

## 🚀 Étape 2 : Déployer sur Vercel

### 2.1 Créer le projet Vercel

1. **Allez sur** : https://vercel.com/new
2. **Connectez GitHub** si ce n'est pas déjà fait
3. **Import** votre repo : `Whiskerweb/quizlet`

### 2.2 Configuration du projet

Remplissez le formulaire :

- **Project Name** : `quizlet` (ou ce que vous voulez)
- **Framework Preset** : `Next.js` (détecté automatiquement)
- **Root Directory** : `apps/web` ⚠️ **IMPORTANT**
- **Build Command** : `cd apps/web && pnpm install && pnpm build`
- **Output Directory** : `apps/web/.next` (ou laissez vide, Vercel le détecte)
- **Install Command** : `pnpm install`

### 2.3 Variables d'environnement

**Avant de déployer**, ajoutez ces variables dans Vercel :

1. Cliquez sur **"Environment Variables"**
2. Ajoutez :

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://vbqvhumwsbezoipaexsw.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (votre clé complète) |

⚠️ **Important** : Cochez toutes les cases (Production, Preview, Development)

### 2.4 Déployer

1. Cliquez sur **"Deploy"**
2. Attendez 2-3 minutes
3. ✅ Votre app est en ligne !

## 🔧 Étape 3 : Configurer Supabase pour la production

### 3.1 Mettre à jour les URLs de redirection

1. Dans **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. **Site URL** : `https://votre-app.vercel.app` (remplacez par votre URL Vercel)
3. **Redirect URLs** : Ajoutez :
   ```
   https://votre-app.vercel.app/**
   http://localhost:3000/**
   ```

### 3.2 Vérifier que la confirmation d'email est désactivée

1. **Authentication** → **Providers** → **Email**
2. Vérifiez que **"Confirm email"** est désactivé (OFF)

## ✅ Étape 4 : Tester

1. Ouvrez votre URL Vercel : `https://votre-app.vercel.app`
2. Testez :
   - ✅ Créer un compte
   - ✅ Se connecter
   - ✅ Créer un set
   - ✅ Ajouter des flashcards
   - ✅ Étudier

## 🎉 C'est tout !

Votre app est maintenant en production et 100% gratuite !

## 📊 Monitoring

- **Vercel Dashboard** : Voir les logs, métriques, déploiements
- **Supabase Dashboard** : Voir les utilisateurs, la base de données, les logs

## 🔄 Mises à jour automatiques

Vercel déploie automatiquement à chaque push sur `main` ! 🚀

## 🆘 Problèmes courants

### "Build failed"
→ Vérifiez que `Root Directory` = `apps/web`

### "Environment variable not found"
→ Vérifiez que les variables sont bien définies dans Vercel

### "CORS error"
→ Vérifiez que les URLs Supabase sont bien configurées

---

**Besoin d'aide ?** Consultez les logs dans Vercel Dashboard → Deployments








