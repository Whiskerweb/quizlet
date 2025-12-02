# 💰 Options de Déploiement GRATUITES

## 🆓 Alternatives Gratuites à Railway

Railway a changé son modèle : **$1/mois minimum** après un essai gratuit de 30 jours.

Voici les **meilleures alternatives GRATUITES** pour déployer votre backend :

---

## 🥇 Option 1 : Render (Recommandé - 100% Gratuit)

### ✅ Avantages
- **100% gratuit** pour les projets personnels
- PostgreSQL gratuit inclus
- Déploiement automatique depuis GitHub
- SSL/HTTPS automatique
- Pas de carte bancaire requise

### 📋 Limites Gratuites
- **750 heures/mois** de runtime (suffisant pour 24/7)
- **512 MB RAM** par service
- **0.1 CPU** par service
- **1 GB** de stockage PostgreSQL
- Service peut "s'endormir" après 15 min d'inactivité (se réveille au premier appel)

### 🚀 Déploiement sur Render

1. **Allez sur** : https://render.com/signup
2. **Connectez GitHub**
3. **New → Web Service**
   - Repository : `Whiskerweb/quizlet`
   - Root Directory : `apps/api`
   - Build Command : `cd apps/api && pnpm install && pnpm build && pnpm prisma:generate`
   - Start Command : `cd apps/api && pnpm start:prod`
   - Environment : `Node`

4. **New → PostgreSQL**
   - Plan : **Free**
   - Database Name : `quizlet`
   - Copiez la `DATABASE_URL` automatiquement générée

5. **Variables d'environnement** (dans le Web Service) :
   ```
   DATABASE_URL=<fourni par Render PostgreSQL>
   JWT_SECRET=<généré avec pnpm generate-secrets>
   JWT_REFRESH_SECRET=<généré avec pnpm generate-secrets>
   JWT_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d
   NODE_ENV=production
   PORT=10000
   FRONTEND_URL=https://votre-app.vercel.app
   ```

6. **Migrations Prisma** :
   - Dans Render, allez dans votre service → **Shell**
   - Exécutez : `cd apps/api && pnpm prisma:migrate:deploy`

✅ **C'est tout ! Gratuit et fonctionnel !**

---

## 🥈 Option 2 : Fly.io (100% Gratuit)

### ✅ Avantages
- **100% gratuit** avec généreuses limites
- PostgreSQL gratuit
- Pas de "sleep" (service toujours actif)
- Performance excellente

### 📋 Limites Gratuites
- **3 VMs gratuites** partagées
- **3 GB** de stockage
- **160 GB** de bande passante/mois

### 🚀 Déploiement sur Fly.io

1. **Installez Fly CLI** :
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Créez un compte** : https://fly.io/app/sign-up

3. **Login** :
   ```bash
   fly auth login
   ```

4. **Créez l'app** :
   ```bash
   cd apps/api
   fly launch
   ```

5. **Ajoutez PostgreSQL** :
   ```bash
   fly postgres create --name quizlet-db
   fly postgres attach quizlet-db
   ```

6. **Configurez les secrets** :
   ```bash
   fly secrets set JWT_SECRET=<votre-secret>
   fly secrets set JWT_REFRESH_SECRET=<votre-secret>
   fly secrets set JWT_EXPIRES_IN=15m
   fly secrets set JWT_REFRESH_EXPIRES_IN=7d
   fly secrets set NODE_ENV=production
   fly secrets set FRONTEND_URL=https://votre-app.vercel.app
   ```

7. **Déployez** :
   ```bash
   fly deploy
   ```

---

## 🥉 Option 3 : Render + Railway (Hybride)

- **Backend** : Render (gratuit)
- **Frontend** : Vercel (gratuit)
- **Base de données** : Render PostgreSQL (gratuit)

**Coût total : $0/mois** ✅

---

## 📊 Comparaison Rapide

| Plateforme | Coût | PostgreSQL | Sleep Mode | Facilité |
|------------|------|------------|------------|----------|
| **Render** | 🆓 Gratuit | ✅ Inclus | ⚠️ Oui (15 min) | ⭐⭐⭐⭐⭐ |
| **Fly.io** | 🆓 Gratuit | ✅ Inclus | ❌ Non | ⭐⭐⭐⭐ |
| **Railway** | 💰 $1/mois | ✅ Inclus | ❌ Non | ⭐⭐⭐⭐⭐ |
| **Heroku** | 💰 $5/mois | 💰 Payant | ⚠️ Oui | ⭐⭐⭐ |

---

## 🎯 Recommandation

**Pour votre projet Quizlet, je recommande Render** car :
- ✅ 100% gratuit
- ✅ Très simple à configurer
- ✅ PostgreSQL inclus
- ✅ Déploiement automatique
- ✅ Documentation excellente

Le seul "inconvénient" : le service peut mettre 30 secondes à se réveiller après 15 min d'inactivité. Pour une app d'apprentissage, c'est parfaitement acceptable !

---

## 🚀 Guide Render Complet

Voir `DEPLOY_RENDER.md` pour un guide détaillé étape par étape.

---

## 💡 Astuce

Si vous voulez éviter le "sleep" de Render, vous pouvez :
1. Utiliser un service de "ping" gratuit (UptimeRobot, etc.) qui appelle votre API toutes les 10 minutes
2. Ou utiliser Fly.io qui ne "dort" jamais

---

**Conclusion : Oui, vous pouvez déployer 100% gratuitement avec Render ou Fly.io !** 🎉











