# Guide de Déploiement
## Quizlet Clone - Instructions de déploiement complet

---

## 🚀 Déploiement Frontend (Vercel)

### Configuration Vercel

1. **Connecter le repository GitHub**
   - Allez sur https://vercel.com
   - Importez le repository `Whiskerweb/quizlet`
   - Configurez le projet

2. **Paramètres du projet Vercel**
   - **Root Directory**: `apps/web`
   - **Framework Preset**: Next.js (auto-détecté)
   - **Build Command**: (vide - auto)
   - **Output Directory**: (vide - auto)
   - **Install Command**: `pnpm install`

3. **Variables d'environnement**
   ```
   NEXT_PUBLIC_API_URL=https://votre-backend-url.com
   ```

4. **Déployer**
   - Vercel déploiera automatiquement à chaque push sur `main`

---

## 🔧 Déploiement Backend

### Option 1: Railway (Recommandé)

1. **Créer un compte Railway**
   - Allez sur https://railway.app
   - Connectez votre GitHub

2. **Créer un nouveau projet**
   - New Project → Deploy from GitHub repo
   - Sélectionnez `quizlet`
   - Configurez le service

3. **Configuration**
   - **Root Directory**: `apps/api`
   - **Build Command**: `cd apps/api && pnpm install && pnpm build`
   - **Start Command**: `cd apps/api && pnpm start:prod`

4. **Ajouter PostgreSQL**
   - Railway → New → Database → PostgreSQL
   - Railway créera automatiquement la DATABASE_URL

5. **Variables d'environnement**
   ```
   DATABASE_URL=<fourni par Railway>
   JWT_SECRET=<générez un secret aléatoire>
   JWT_EXPIRES_IN=15m
   JWT_REFRESH_SECRET=<générez un secret aléatoire>
   JWT_REFRESH_EXPIRES_IN=7d
   PORT=3001
   NODE_ENV=production
   FRONTEND_URL=https://votre-app-vercel.vercel.app
   ```

6. **Migrations Prisma**
   - Railway → Service → Deploy Logs
   - Ajoutez un script de build :
   ```bash
   cd apps/api && npx prisma generate && npx prisma migrate deploy
   ```

### Option 2: Render

1. **Créer un compte Render**
   - Allez sur https://render.com
   - Connectez GitHub

2. **Créer un Web Service**
   - New → Web Service
   - Connectez le repo `quizlet`
   - **Root Directory**: `apps/api`
   - **Build Command**: `cd apps/api && pnpm install && pnpm build`
   - **Start Command**: `cd apps/api && pnpm start:prod`

3. **Ajouter PostgreSQL**
   - New → PostgreSQL
   - Copiez la DATABASE_URL

4. **Variables d'environnement** (comme Railway)

### Option 3: Heroku

1. **Créer une app Heroku**
   ```bash
   heroku create quizlet-api
   ```

2. **Configurer le buildpack**
   ```bash
   heroku buildpacks:set heroku/nodejs
   ```

3. **Ajouter PostgreSQL**
   ```bash
   heroku addons:create heroku-postgresql:mini
   ```

4. **Variables d'environnement**
   ```bash
   heroku config:set JWT_SECRET=...
   heroku config:set JWT_REFRESH_SECRET=...
   heroku config:set FRONTEND_URL=https://votre-app.vercel.app
   ```

5. **Déployer**
   ```bash
   git push heroku main
   ```

---

## 🗄️ Base de Données

### Après déploiement du backend

1. **Générer Prisma Client**
   ```bash
   cd apps/api
   npx prisma generate
   ```

2. **Appliquer les migrations**
   ```bash
   npx prisma migrate deploy
   ```

### Alternative : Migration manuelle

Si vous avez accès à la base de données :
```bash
psql $DATABASE_URL < apps/api/prisma/migrations/20251129172327_init/migration.sql
psql $DATABASE_URL < apps/api/prisma/migrations/20251129174219_add_card_progress/migration.sql
```

---

## ✅ Vérification

### Frontend
- ✅ Accessible sur https://votre-app.vercel.app
- ✅ Peut se connecter au backend via `NEXT_PUBLIC_API_URL`

### Backend
- ✅ API accessible sur https://votre-backend.railway.app (ou autre)
- ✅ Base de données connectée
- ✅ Migrations appliquées
- ✅ Endpoints répondent correctement

### Test complet
1. Créer un compte
2. Se connecter
3. Créer un set
4. Ajouter des flashcards
5. Étudier un set

---

## 🔐 Sécurité Production

### Variables d'environnement importantes

**Backend:**
- `JWT_SECRET`: Utilisez un secret fort (générez avec `openssl rand -base64 32`)
- `JWT_REFRESH_SECRET`: Un autre secret différent
- `DATABASE_URL`: Fourni par votre provider de DB

**Frontend:**
- `NEXT_PUBLIC_API_URL`: URL complète de votre backend

### Recommandations
- ✅ Utilisez HTTPS partout
- ✅ Configurez CORS correctement
- ✅ Rate limiting en production
- ✅ Monitoring et logs
- ✅ Backups de la base de données

---

## 📝 Checklist de déploiement

- [ ] Backend déployé (Railway/Render/Heroku)
- [ ] Base de données PostgreSQL créée
- [ ] Migrations Prisma appliquées
- [ ] Variables d'environnement backend configurées
- [ ] Frontend déployé sur Vercel
- [ ] Variable `NEXT_PUBLIC_API_URL` configurée dans Vercel
- [ ] Root Directory configuré dans Vercel (`apps/web`)
- [ ] Test de création de compte
- [ ] Test de connexion
- [ ] Test de création de set
- [ ] Test des modes d'étude

---

**Une fois tout configuré, vous pourrez créer un compte et utiliser toutes les fonctionnalités !** 🎉












