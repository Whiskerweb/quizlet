# 🚀 Migration vers Supabase - Guide Complet

## ✅ Ce qui a été fait

1. ✅ Schéma SQL Supabase créé avec RLS (Row Level Security)
2. ✅ Client Supabase configuré (browser, server, middleware)
3. ✅ AuthStore migré vers Supabase Auth
4. ✅ Pages login/register migrées
5. ✅ Services Supabase créés (sets, flashcards)
6. ✅ API Routes Next.js pour study sessions
7. ✅ Types TypeScript générés

## 📋 Étapes pour finaliser la migration

### 1. Créer le projet Supabase

1. Allez sur https://supabase.com
2. Créez un nouveau projet
3. Notez :
   - **Project URL** : `https://xxxxx.supabase.co`
   - **Anon Key** : `eyJhbGc...`

### 2. Exécuter le schéma SQL

1. Dans Supabase Dashboard → **SQL Editor**
2. Copiez-collez le contenu de `supabase/schema.sql`
3. Exécutez le script

### 3. Configurer les variables d'environnement

Créez/modifiez `.env.local` dans `apps/web` :

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

### 4. Tester localement

```bash
cd apps/web
pnpm dev
```

### 5. Déployer sur Vercel

1. Ajoutez les variables d'environnement dans Vercel
2. Déployez !

## 🔄 Changements majeurs

### Auth
- ❌ Avant : JWT custom avec NestJS
- ✅ Maintenant : Supabase Auth (gratuit, géré)

### Base de données
- ❌ Avant : PostgreSQL à déployer (Railway/Render)
- ✅ Maintenant : Supabase PostgreSQL (gratuit, inclus)

### Backend
- ❌ Avant : NestJS complet à déployer
- ✅ Maintenant : API Routes Next.js (sur Vercel)

### Déploiement
- ❌ Avant : 2 services (API + DB)
- ✅ Maintenant : 1 service (Vercel uniquement)

## 📝 Fichiers à mettre à jour

### Pages restantes à migrer :
- [ ] `app/(dashboard)/sets/create/page.tsx`
- [ ] `app/(dashboard)/sets/[id]/flashcards/new/page.tsx`
- [ ] `app/(dashboard)/study/[id]/page.tsx`
- [ ] `app/(dashboard)/profile/[username]/page.tsx`
- [ ] `app/s/[shareId]/page.tsx`
- [ ] `components/layout/Navbar.tsx`

### Services à créer :
- [ ] `lib/supabase/study.ts` (pour study sessions)
- [ ] `lib/supabase/stats.ts` (pour statistiques)

## 🎯 Prochaines étapes

1. Finaliser la migration des pages restantes
2. Tester toutes les fonctionnalités
3. Supprimer le backend NestJS (`apps/api`)
4. Mettre à jour la configuration monorepo
5. Déployer sur Vercel

## 💡 Avantages de Supabase

- ✅ **100% gratuit** (500 MB DB, 50k utilisateurs/mois)
- ✅ **Pas de backend à déployer**
- ✅ **Auth intégrée** (email, OAuth, etc.)
- ✅ **RLS automatique** (sécurité au niveau DB)
- ✅ **API auto-générée** (PostgREST)
- ✅ **Storage inclus** (pour images/audio)
- ✅ **Edge Functions** (pour logique complexe)

## 🆘 Problèmes courants

### "Invalid API key"
→ Vérifiez `NEXT_PUBLIC_SUPABASE_ANON_KEY` dans `.env.local`

### "Row Level Security policy violation"
→ Vérifiez que les policies RLS sont bien créées dans Supabase

### "User not authenticated"
→ Vérifiez que le middleware Supabase est bien configuré

---

**Migration en cours...** 🚧











