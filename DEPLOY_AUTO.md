# 🚀 Déploiement Automatique - Guide Ultra Simple

Ce guide vous permet de déployer l'application en **5 minutes** avec le minimum d'effort.

---

## 📋 Prérequis

- Un compte GitHub (vous l'avez déjà : `Whiskerweb/quizlet`)
- Un compte Vercel (gratuit) : https://vercel.com/signup
- Un compte Railway (gratuit) : https://railway.app/signup

---

## 🎯 Étape 1 : Déployer le Backend (Railway) - 3 minutes

### Option A : Via le Dashboard Railway (Recommandé)

1. **Allez sur Railway** : https://railway.app/new
2. **Cliquez sur "Deploy from GitHub repo"**
3. **Sélectionnez votre repo** : `Whiskerweb/quizlet`
4. **Railway détecte automatiquement** le backend dans `apps/api`

### Configuration automatique :

Railway va :
- ✅ Détecter que c'est un projet Node.js
- ✅ Installer les dépendances (`pnpm install`)
- ✅ Builder le projet (`pnpm build`)
- ✅ Générer Prisma Client (`prisma generate`)

### Ajouter PostgreSQL :

1. Dans votre projet Railway, cliquez sur **"+ New"**
2. Sélectionnez **"Database"** → **"Add PostgreSQL"**
3. Railway créera automatiquement la base de données

### Variables d'environnement :

1. Dans votre service backend, allez dans **"Variables"**
2. Ajoutez ces variables :

```env
# Générer les secrets (voir ci-dessous)
JWT_SECRET=<généré>
JWT_REFRESH_SECRET=<généré>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://votre-app.vercel.app
```

**Pour générer les secrets JWT :**
```bash
node scripts/generate-secrets.js
```

3. **DATABASE_URL** est automatiquement ajouté par Railway quand vous créez PostgreSQL

### Appliquer les migrations :

1. Dans Railway, allez dans votre service backend
2. Ouvrez la **"Deploy Logs"**
3. Cliquez sur **"Deploy"** → **"Settings"** → **"Deploy Command"**
4. Ajoutez : `cd apps/api && pnpm install && pnpm build && pnpm prisma:generate && pnpm prisma:migrate:deploy && pnpm start:prod`

**OU** utilisez le terminal Railway :
1. Cliquez sur votre service → **"Deploy Logs"** → **"Terminal"**
2. Exécutez : `cd apps/api && pnpm prisma:migrate:deploy`

### Obtenir l'URL du backend :

1. Dans Railway, votre service backend a une URL comme : `https://quizlet-api-production.up.railway.app`
2. **Copiez cette URL** - vous en aurez besoin pour Vercel

---

## 🎯 Étape 2 : Déployer le Frontend (Vercel) - 2 minutes

### Via le Dashboard Vercel :

1. **Allez sur Vercel** : https://vercel.com/new
2. **Importez votre repo GitHub** : `Whiskerweb/quizlet`
3. **Configuration automatique** :
   - Framework Preset : **Next.js** (auto-détecté)
   - Root Directory : **`apps/web`** ⚠️ **IMPORTANT**
   - Build Command : (laissez vide - auto)
   - Output Directory : (laissez vide - auto)
   - Install Command : `pnpm install`

### Variables d'environnement :

1. Dans Vercel, allez dans votre projet → **"Settings"** → **"Environment Variables"**
2. Ajoutez :

```env
NEXT_PUBLIC_API_URL=https://votre-backend-railway.railway.app
```

⚠️ Remplacez `https://votre-backend-railway.railway.app` par l'URL réelle de votre backend Railway

### Déployer :

1. Cliquez sur **"Deploy"**
2. Vercel va automatiquement :
   - Installer les dépendances
   - Builder Next.js
   - Déployer l'application

3. **Votre app est en ligne !** 🎉

---

## ✅ Vérification

### Testez votre application :

1. **Frontend** : Ouvrez l'URL Vercel (ex: `https://quizlet.vercel.app`)
2. **Créez un compte** : `/register`
3. **Connectez-vous** : `/login`
4. **Créez un set** : Dashboard → "Créer un set"
5. **Ajoutez des flashcards**
6. **Étudiez** : Cliquez sur "Étudier"

### Si ça ne fonctionne pas :

1. **Vérifiez les logs** :
   - Railway : Service → Deploy Logs
   - Vercel : Project → Deployments → (cliquez sur un déploiement) → Logs

2. **Vérifiez les variables d'environnement** :
   - Railway : Toutes les variables sont définies ?
   - Vercel : `NEXT_PUBLIC_API_URL` pointe vers Railway ?

3. **Vérifiez les migrations** :
   - Railway Terminal : `cd apps/api && pnpm prisma:migrate:deploy`

---

## 🔄 Mises à jour Automatiques

### Déploiement continu :

- **Railway** : Déploie automatiquement à chaque push sur `main`
- **Vercel** : Déploie automatiquement à chaque push sur `main`

**Vous n'avez rien à faire !** Juste `git push` et c'est déployé. 🚀

---

## 📊 Monitoring

### Railway :
- **Logs** : Service → Deploy Logs
- **Métriques** : Service → Metrics
- **Base de données** : PostgreSQL → Data

### Vercel :
- **Analytics** : Project → Analytics
- **Logs** : Project → Deployments → Logs
- **Performance** : Project → Speed Insights

---

## 🆘 Support

### Problèmes courants :

1. **"No Next.js version detected"**
   - ✅ Vérifiez que Root Directory = `apps/web` dans Vercel

2. **"Database connection failed"**
   - ✅ Vérifiez que `DATABASE_URL` est défini dans Railway
   - ✅ Vérifiez que PostgreSQL est créé et connecté

3. **"CORS error"**
   - ✅ Vérifiez que `FRONTEND_URL` dans Railway = URL Vercel
   - ✅ Vérifiez que `NEXT_PUBLIC_API_URL` dans Vercel = URL Railway

4. **"401 Unauthorized"**
   - ✅ Vérifiez que `JWT_SECRET` et `JWT_REFRESH_SECRET` sont définis

---

## 🎉 C'est tout !

Votre application Quizlet est maintenant en production et fonctionne ! 

**Résumé :**
- ✅ Backend : Railway (gratuit)
- ✅ Frontend : Vercel (gratuit)
- ✅ Base de données : PostgreSQL sur Railway (gratuit)
- ✅ Déploiement automatique : À chaque push sur GitHub

**Coût : $0/mois** (tant que vous restez dans les limites gratuites) 💰









