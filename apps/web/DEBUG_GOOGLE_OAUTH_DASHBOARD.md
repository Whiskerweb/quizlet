# Debug : Accès au dashboard pour les utilisateurs Google OAuth

## 🔍 Problème identifié

Les utilisateurs Google OAuth étaient bloqués lors de l'accès au dashboard, alors que les utilisateurs email/password y accédaient sans problème.

## 🐛 Cause racine

Le layout du dashboard vérifiait `user` depuis le **store Zustand** (`useAuthStore`), pas directement depuis la **session Supabase**. Si le store n'était pas mis à jour correctement après le callback OAuth, `user` était `null` même si la session existait.

## ✅ Corrections apportées

### 1. Layout du Dashboard (`apps/web/app/(dashboard)/layout.tsx`)

#### Changements principaux :

1. **Vérification de la session directement depuis Supabase** (pas depuis le store)
   ```typescript
   // AVANT : Dépendait du store
   const { user } = useAuthStore();
   
   // APRÈS : Vérifie directement la session Supabase
   const { data: { user: sessionUser } } = await supabase.auth.getUser();
   ```

2. **Logique simplifiée et claire** :
   - **Étape 1** : Vérifier la session Supabase directement
   - **Étape 2** : Si pas de session → redirect `/login`
   - **Étape 3** : Mettre à jour le store avec l'utilisateur
   - **Étape 4** : Vérifier le profil
   - **Étape 5** : Si pas de profil → créer via RPC
   - **Étape 6** : Si création échoue → redirect `/login`
   - **Étape 7** : Mettre à jour le store avec le profil
   - **Étape 8** : Autoriser l'accès au dashboard

3. **Logs de debug ajoutés** pour tracer chaque étape :
   - Session check
   - Profile check
   - Profile creation
   - Final authorization

4. **Vérification finale améliorée** :
   ```typescript
   // Vérifie à la fois le store ET la session pour être sûr
   if (!user || !profile) {
     return null; // Redirect en cours
   }
   ```

### 2. Page Callback OAuth (`apps/web/app/auth/callback/page.tsx`)

#### Changements principaux :

1. **Logs de debug ajoutés** pour tracer :
   - Session processing
   - Profile check
   - Profile creation
   - Store update
   - Redirection

2. **Délai augmenté** avant redirection (200ms au lieu de 100ms) pour s'assurer que le store est bien mis à jour

3. **Vérification explicite** que le profil existe avant de continuer

## 📋 Flux complet après corrections

### Pour un utilisateur Google OAuth :

1. **Authentification Google** → Redirection vers `/auth/callback`
2. **Page callback** :
   - Détecte la session Supabase
   - Vérifie le profil dans `public.profiles`
   - Si absent → crée via RPC `create_or_update_profile`
   - Met à jour le store (`setUser`, `setProfile`)
   - Attend 200ms pour que le store soit mis à jour
   - Redirige vers `/dashboard`
3. **Layout du dashboard** :
   - Vérifie la session Supabase directement (pas le store)
   - Si session existe → continue
   - Vérifie le profil dans `public.profiles`
   - Si absent → crée via RPC (sécurité supplémentaire)
   - Met à jour le store
   - Autorise l'accès au dashboard

### Pour un utilisateur email/password :

1. **Login** → Met à jour le store directement
2. **Redirection** vers `/dashboard`
3. **Layout du dashboard** :
   - Vérifie la session Supabase directement
   - Si session existe → continue
   - Vérifie le profil (existe toujours pour email/password)
   - Met à jour le store
   - Autorise l'accès au dashboard

## 🔑 Points clés

### Comment la session est récupérée :

```typescript
// Dans le layout du dashboard
const { data: { user: sessionUser }, error: sessionError } = await supabase.auth.getUser();

// On vérifie directement depuis Supabase, pas depuis le store
if (!sessionUser || sessionError) {
  router.push('/login');
  return;
}
```

### Comment le profil est vérifié :

```typescript
// Requête directe à Supabase
let { data: profile, error: profileError } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', sessionUser.id)
  .single();

// Si absent, création via RPC
if (profileError || !profile) {
  await supabase.rpc('create_or_update_profile', { ... });
  // Puis récupération du profil créé
}
```

### Quand et pourquoi un redirect est fait vers `/login` :

1. **Pas de session Supabase** :
   ```typescript
   if (!sessionUser || sessionError) {
     router.push('/login');
   }
   ```

2. **Échec de création du profil** :
   ```typescript
   if (rpcError) {
     router.push('/login');
   }
   ```

3. **Impossible de récupérer le profil après création** :
   ```typescript
   if (fetchError || !newProfile) {
     router.push('/login');
   }
   ```

4. **Pas de profil disponible après toutes les tentatives** :
   ```typescript
   if (!profile) {
     router.push('/login');
   }
   ```

## 🎯 Condition d'autorisation

**L'utilisateur peut accéder au dashboard si et seulement si :**
- ✅ Une session Supabase existe (`supabase.auth.getUser()` retourne un user)
- ✅ Un profil existe dans `public.profiles` avec `id = user.id`

**L'utilisateur est redirigé vers `/login` si :**
- ❌ Pas de session Supabase
- ❌ Pas de profil ET impossible de le créer
- ❌ Impossible de récupérer le profil après création

## 📝 Logs de debug

Les logs suivants sont maintenant disponibles dans la console :

- `[Dashboard Layout] Session check:` - Vérification de la session
- `[Dashboard Layout] Profile check:` - Vérification du profil
- `[Dashboard Layout] Profile created successfully:` - Profil créé
- `[Dashboard Layout] Auth check complete:` - Autorisation accordée
- `[OAuth Callback] Processing session:` - Traitement de la session OAuth
- `[OAuth Callback] Profile check:` - Vérification du profil OAuth
- `[OAuth Callback] Store updated:` - Store mis à jour

## ✅ Résultat attendu

- ✅ Les utilisateurs Google OAuth peuvent accéder au dashboard
- ✅ La session est vérifiée directement depuis Supabase (pas le store)
- ✅ Le profil est créé automatiquement si absent
- ✅ Les logs permettent de déboguer facilement
- ✅ La logique est simple et claire : session + profil = accès autorisé

