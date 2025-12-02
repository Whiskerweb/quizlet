# 🚀 Configuration Supabase - Guide Rapide

## Étape 1 : Créer le projet Supabase

1. Allez sur https://supabase.com
2. Cliquez sur **"New Project"**
3. Remplissez :
   - **Name** : `quizlet` (ou ce que vous voulez)
   - **Database Password** : Choisissez un mot de passe fort
   - **Region** : Choisissez la région la plus proche
4. Cliquez sur **"Create new project"**
5. Attendez 2-3 minutes que le projet soit créé

## Étape 2 : Récupérer les clés API

1. Dans le dashboard Supabase, allez dans **Settings** → **API**
2. Copiez :
   - **Project URL** : `https://xxxxx.supabase.co`
   - **anon public key** : `eyJhbGc...`

## Étape 3 : Exécuter le schéma SQL

1. Dans Supabase Dashboard, allez dans **SQL Editor**
2. Cliquez sur **"New query"**
3. Ouvrez le fichier `supabase/schema.sql` de ce projet
4. Copiez-collez **tout le contenu** dans l'éditeur SQL
5. Cliquez sur **"Run"** (ou `Cmd/Ctrl + Enter`)
6. Vous devriez voir : `Success. No rows returned`

✅ **La base de données est maintenant configurée !**

## Étape 4 : Configurer les variables d'environnement

### Localement

Créez `apps/web/.env.local` :

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

### Sur Vercel

1. Allez dans votre projet Vercel
2. **Settings** → **Environment Variables**
3. Ajoutez :
   - `NEXT_PUBLIC_SUPABASE_URL` = votre Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = votre anon key

## Étape 5 : Tester

```bash
cd apps/web
pnpm dev
```

Ouvrez http://localhost:3000 et testez :
- ✅ Créer un compte
- ✅ Se connecter
- ✅ Créer un set
- ✅ Ajouter des flashcards
- ✅ Étudier

## 🎉 C'est tout !

Votre app est maintenant connectée à Supabase !

## 🔒 Sécurité

- ✅ **RLS (Row Level Security)** est activé
- ✅ Les utilisateurs ne peuvent voir/modifier que leurs propres données
- ✅ Les sets publics sont accessibles à tous
- ✅ L'auth est gérée par Supabase (sécurisé)

## 📊 Monitoring

Dans Supabase Dashboard :
- **Database** → Voir vos tables et données
- **Authentication** → Voir les utilisateurs
- **Logs** → Voir les requêtes SQL
- **API** → Tester les endpoints

## 🆘 Problèmes courants

### "Invalid API key"
→ Vérifiez que les variables d'environnement sont bien définies

### "Row Level Security policy violation"
→ Vérifiez que le schéma SQL a bien été exécuté

### "User not authenticated"
→ Vérifiez que vous êtes bien connecté

---

**Besoin d'aide ?** Consultez `SUPABASE_MIGRATION.md` pour plus de détails.








