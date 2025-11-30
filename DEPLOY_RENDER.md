# 🚀 Déploiement sur Render (100% Gratuit)

## Guide Complet - Backend + PostgreSQL

---

## 📋 Prérequis

- Un compte GitHub (vous l'avez : `Whiskerweb/quizlet`)
- Un compte Render : https://render.com/signup (gratuit, pas de carte bancaire)

---

## 🎯 Étape 1 : Créer le Service Web (Backend)

### 1.1 Créer le Service

1. **Allez sur Render** : https://dashboard.render.com
2. **Cliquez sur "New +"** → **"Web Service"**
3. **Connectez votre repository GitHub** si ce n'est pas déjà fait
4. **Sélectionnez** : `Whiskerweb/quizlet`

### 1.2 Configuration du Service

Remplissez le formulaire :

- **Name** : `quizlet-api` (ou ce que vous voulez)
- **Region** : Choisissez la région la plus proche (ex: `Frankfurt` pour l'Europe)
- **Branch** : `main`
- **Root Directory** : `apps/api` ⚠️ **IMPORTANT**
- **Runtime** : `Node`
- **Build Command** : 
  ```
  cd apps/api && pnpm install && pnpm build && pnpm prisma:generate
  ```
- **Start Command** : 
  ```
  cd apps/api && pnpm start:prod
  ```
- **Plan** : **Free** ✅

### 1.3 Variables d'Environnement

Avant de créer le service, **générez vos secrets JWT** :

```bash
pnpm generate-secrets
```

Copiez les valeurs, puis dans Render, ajoutez ces variables :

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `10000` (Render utilise ce port) |
| `JWT_SECRET` | `<valeur générée>` |
| `JWT_REFRESH_SECRET` | `<valeur générée>` |
| `JWT_EXPIRES_IN` | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |
| `FRONTEND_URL` | `https://votre-app.vercel.app` (vous l'ajouterez après Vercel) |

⚠️ **Ne mettez pas `DATABASE_URL` maintenant** - on va créer PostgreSQL ensuite.

### 1.4 Créer le Service

Cliquez sur **"Create Web Service"**

Render va :
- ✅ Cloner votre repo
- ✅ Installer les dépendances
- ✅ Builder le projet
- ✅ Générer Prisma Client
- ⚠️ Le déploiement va échouer (pas de DATABASE_URL), c'est normal !

---

## 🗄️ Étape 2 : Créer PostgreSQL

### 2.1 Créer la Base de Données

1. Dans le dashboard Render, cliquez sur **"New +"** → **"PostgreSQL"**
2. Configuration :
   - **Name** : `quizlet-db`
   - **Database** : `quizlet`
   - **User** : `quizlet`
   - **Region** : Même région que votre service web
   - **Plan** : **Free** ✅
   - **PostgreSQL Version** : `15` (ou la plus récente)

3. Cliquez sur **"Create Database"**

### 2.2 Récupérer la DATABASE_URL

1. Une fois créée, allez dans votre base de données
2. Dans l'onglet **"Connections"**, vous verrez :
   - **Internal Database URL** : `postgresql://...`
   - **External Database URL** : `postgresql://...`

3. **Copiez l'Internal Database URL** (pour le service web)

### 2.3 Ajouter DATABASE_URL au Service Web

1. Retournez dans votre **Web Service** (`quizlet-api`)
2. Allez dans **"Environment"**
3. Ajoutez :
   - **Key** : `DATABASE_URL`
   - **Value** : `<Internal Database URL copiée>`
4. Cliquez sur **"Save Changes"**

Render va **redéployer automatiquement** votre service.

---

## 🔧 Étape 3 : Appliquer les Migrations Prisma

### 3.1 Via Shell Render

1. Dans votre **Web Service**, allez dans l'onglet **"Shell"**
2. Exécutez :
   ```bash
   cd apps/api
   pnpm prisma:migrate:deploy
   ```

3. Vous devriez voir :
   ```
   ✅ Applied migration: 20251129172327_init
   ✅ Applied migration: 20251129174219_add_card_progress
   ```

### 3.2 Vérifier

Dans le Shell, vous pouvez vérifier :
```bash
cd apps/api
pnpm prisma:studio
```

(Note : Prisma Studio ne fonctionne pas dans Render Shell, mais c'est OK)

---

## ✅ Étape 4 : Vérifier le Déploiement

### 4.1 Vérifier les Logs

1. Dans votre **Web Service**, allez dans **"Logs"**
2. Vous devriez voir :
   ```
   🚀 API server running on http://localhost:10000
   ```

### 4.2 Tester l'Endpoint Health

Votre service a une URL comme : `https://quizlet-api.onrender.com`

Testez :
```bash
curl https://quizlet-api.onrender.com/health
```

Réponse attendue :
```json
{
  "status": "ok",
  "timestamp": "2024-...",
  "uptime": 123.45
}
```

### 4.3 Copier l'URL

**Copiez l'URL complète** de votre service (ex: `https://quizlet-api.onrender.com`)
Vous en aurez besoin pour Vercel !

---

## 🎯 Étape 5 : Configurer Vercel (Frontend)

1. **Allez sur Vercel** : https://vercel.com/new
2. **Import** votre repo `Whiskerweb/quizlet`
3. **Configuration** :
   - Root Directory : `apps/web`
   - Framework : Next.js
   - Install Command : `pnpm install`
4. **Environment Variables** :
   ```
   NEXT_PUBLIC_API_URL=https://quizlet-api.onrender.com
   ```
   (Remplacez par votre URL Render réelle)

5. **Deploy** → Attendez 2 minutes

6. **Copiez l'URL Vercel** (ex: `https://quizlet.vercel.app`)

---

## 🔄 Étape 6 : Finaliser CORS

1. **Retournez sur Render**
2. Dans votre **Web Service** → **Environment**
3. Modifiez `FRONTEND_URL` :
   ```
   FRONTEND_URL=https://quizlet.vercel.app
   ```
   (Remplacez par votre URL Vercel réelle)

4. Render va **redéployer automatiquement**

---

## ✅ Test Final

1. Ouvrez votre URL Vercel
2. Créez un compte
3. Créez un set
4. Étudiez !

**🎉 C'est en ligne et 100% gratuit !**

---

## 🆘 Problèmes Courants

### "Build failed"

**Solution** :
- Vérifiez que `Root Directory` = `apps/api`
- Vérifiez les logs pour voir l'erreur exacte

### "Database connection failed"

**Solution** :
- Vérifiez que `DATABASE_URL` est bien défini
- Vérifiez que vous utilisez l'**Internal Database URL** (pas External)
- Vérifiez que PostgreSQL est bien créé et actif

### "Service sleeping"

**Solution** :
- C'est normal ! Render met le service en veille après 15 min d'inactivité
- Il se réveille automatiquement au premier appel (30 secondes)
- Pour éviter ça, utilisez un service de ping gratuit (UptimeRobot)

### "CORS error"

**Solution** :
- Vérifiez que `FRONTEND_URL` dans Render = URL Vercel exacte
- Vérifiez que `NEXT_PUBLIC_API_URL` dans Vercel = URL Render exacte

---

## 📊 Monitoring

### Logs
- **Render** : Service → Logs (en temps réel)

### Métriques
- **Render** : Service → Metrics (CPU, RAM, etc.)

### Base de Données
- **Render** : PostgreSQL → Metrics (connexions, taille, etc.)

---

## 💡 Astuces

### Éviter le "Sleep Mode"

Créez un compte gratuit sur **UptimeRobot** :
1. https://uptimerobot.com
2. Créez un monitor pour : `https://quizlet-api.onrender.com/health`
3. Intervalle : 5 minutes
4. Votre service ne dormira jamais ! ✅

### Mises à jour Automatiques

Render déploie automatiquement à chaque push sur `main` ! 🚀

---

## 💰 Coût

**$0/mois** - Tout est gratuit :
- ✅ Web Service : 750h/mois gratuits
- ✅ PostgreSQL : 1 GB gratuit
- ✅ SSL/HTTPS : Inclus
- ✅ Déploiement automatique : Inclus

**Limite** : Service peut dormir après 15 min (se réveille automatiquement)

---

**C'est tout ! Votre backend est en production et 100% gratuit ! 🎉**





