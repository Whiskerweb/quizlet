# 🚀 DÉPLOIEMENT EN 5 MINUTES

> ⚠️ **Railway est maintenant payant ($1/mois)**. Pour un déploiement 100% gratuit, utilisez **Render** (voir `DEPLOY_RENDER.md`)

## ⚡ Guide Ultra Rapide

### Étape 1 : Générer les Secrets JWT (30 secondes)

```bash
pnpm generate-secrets
```

Copiez les deux valeurs générées (`JWT_SECRET` et `JWT_REFRESH_SECRET`).

---

### Étape 2 : Déployer le Backend sur Railway (2 minutes)

1. **Allez sur** : https://railway.app/new
2. **"Deploy from GitHub repo"** → Sélectionnez `Whiskerweb/quizlet`
3. Railway détecte automatiquement `apps/api` ✅
4. **"+ New"** → **"Database"** → **"Add PostgreSQL"**
5. **Variables** → Ajoutez :
   - `JWT_SECRET` = (valeur de l'étape 1)
   - `JWT_REFRESH_SECRET` = (valeur de l'étape 1)
   - `JWT_EXPIRES_IN=15m`
   - `JWT_REFRESH_EXPIRES_IN=7d`
   - `NODE_ENV=production`
   - `PORT=3001`
   - `FRONTEND_URL` = (vous l'ajouterez après Vercel)

6. **Settings** → **Deploy Command** :
   ```
   cd apps/api && pnpm install && pnpm build && pnpm prisma:generate && pnpm prisma:migrate:deploy && pnpm start:prod
   ```

7. **Copiez l'URL** du backend (ex: `https://quizlet-api.railway.app`)

---

### Étape 3 : Déployer le Frontend sur Vercel (2 minutes)

1. **Allez sur** : https://vercel.com/new
2. **Import GitHub repo** → `Whiskerweb/quizlet`
3. **Configuration** :
   - **Root Directory** : `apps/web` ⚠️ **TRÈS IMPORTANT**
   - Framework : Next.js (auto-détecté)
   - Build Command : (laissez vide)
   - Output Directory : (laissez vide)
   - Install Command : `pnpm install`

4. **Environment Variables** → Ajoutez :
   ```
   NEXT_PUBLIC_API_URL=https://votre-backend-railway.railway.app
   ```
   (Remplacez par l'URL réelle de Railway de l'étape 2)

5. **Deploy** → Attendez 2 minutes → **C'est en ligne !** 🎉

6. **Copiez l'URL** Vercel (ex: `https://quizlet.vercel.app`)

---

### Étape 4 : Finaliser CORS (30 secondes)

1. **Retournez sur Railway**
2. **Variables** → Modifiez :
   ```
   FRONTEND_URL=https://votre-app.vercel.app
   ```
   (Remplacez par l'URL réelle de Vercel de l'étape 3)

3. **Redeploy** le backend (Railway le fait automatiquement)

---

## ✅ Test Final

1. Ouvrez votre URL Vercel
2. Cliquez sur **"S'inscrire"**
3. Créez un compte
4. Créez un set
5. Ajoutez des flashcards
6. Étudiez !

**🎉 Votre application est en production !**

---

## 📚 Documentation Complète

- **Guide détaillé** : `DEPLOY_AUTO.md`
- **Guide rapide** : `DEPLOY_QUICK_START.md`
- **Fonctionnement backend** : `BACKEND_PRODUCTION.md`

---

## 🆘 Aide Rapide

| Problème | Solution |
|----------|----------|
| "No Next.js detected" | Root Directory = `apps/web` dans Vercel |
| "CORS error" | Vérifiez `FRONTEND_URL` dans Railway = URL Vercel |
| "Database error" | Vérifiez que PostgreSQL est créé dans Railway |
| "401 Unauthorized" | Vérifiez que `JWT_SECRET` est défini dans Railway |

---

## 💰 Coût

**$0/mois** (gratuit dans les limites) :
- Railway : 500h/mois gratuits
- Vercel : Illimité pour projets personnels
- PostgreSQL : Inclus avec Railway

---

**C'est tout ! Profitez de votre application Quizlet ! 🚀**

