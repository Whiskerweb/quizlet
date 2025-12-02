# ⚡ Déploiement Express - 5 Minutes

## 🎯 Étapes Ultra Rapides

### 1️⃣ Backend (Railway) - 2 min

1. **Allez sur** : https://railway.app/new
2. **"Deploy from GitHub repo"** → Sélectionnez `Whiskerweb/quizlet`
3. **"+ New"** → **"Database"** → **"Add PostgreSQL"**
4. **Variables** → Ajoutez :
   ```bash
   # Générez d'abord les secrets :
   pnpm generate-secrets
   ```
   Puis copiez les valeurs dans Railway :
   - `JWT_SECRET` = (valeur générée)
   - `JWT_REFRESH_SECRET` = (valeur générée)
   - `JWT_EXPIRES_IN=15m`
   - `JWT_REFRESH_EXPIRES_IN=7d`
   - `NODE_ENV=production`
   - `PORT=3001`
   - `FRONTEND_URL=https://votre-app.vercel.app` (vous l'ajouterez après Vercel)

5. **Settings** → **Deploy Command** :
   ```
   cd apps/api && pnpm install && pnpm build && pnpm prisma:generate && pnpm prisma:migrate:deploy && pnpm start:prod
   ```

6. **Copiez l'URL** du backend (ex: `https://quizlet-api.railway.app`)

---

### 2️⃣ Frontend (Vercel) - 2 min

1. **Allez sur** : https://vercel.com/new
2. **Import GitHub repo** → `Whiskerweb/quizlet`
3. **Configuration** :
   - Root Directory : **`apps/web`** ⚠️
   - Framework : Next.js (auto)
   - Build Command : (vide)
   - Output Directory : (vide)
   - Install Command : `pnpm install`

4. **Environment Variables** :
   ```
   NEXT_PUBLIC_API_URL=https://votre-backend-railway.railway.app
   ```
   (Remplacez par l'URL réelle de Railway)

5. **Deploy** → C'est fait ! 🎉

---

### 3️⃣ Finaliser - 1 min

1. **Retournez sur Railway**
2. **Variables** → Ajoutez :
   ```
   FRONTEND_URL=https://votre-app.vercel.app
   ```
   (Remplacez par l'URL réelle de Vercel)

3. **Redeploy** le backend pour appliquer CORS

---

## ✅ Test

1. Ouvrez votre URL Vercel
2. Créez un compte
3. Créez un set
4. Étudiez !

**C'est tout ! 🚀**

---

## 🆘 Problèmes ?

- **"No Next.js detected"** → Vérifiez Root Directory = `apps/web`
- **"CORS error"** → Vérifiez `FRONTEND_URL` dans Railway
- **"Database error"** → Vérifiez que PostgreSQL est créé et `DATABASE_URL` existe












