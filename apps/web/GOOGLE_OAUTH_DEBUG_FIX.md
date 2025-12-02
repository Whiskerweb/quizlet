# Debug et Fix : Accès au dashboard pour les utilisateurs Google OAuth

## 🔍 Problème identifié

Les utilisateurs Google OAuth ne pouvaient pas accéder au dashboard alors que :
- ✅ L'utilisateur existe dans `auth.users`
- ✅ Le profil existe dans `public.profiles` avec le même `id`
- ✅ La navbar affiche bien `user_...` et le bouton Logout (session présente)

## 🐛 Cause racine

Le problème venait de la **vérification finale dans le layout** qui dépendait du **store Zustand** plutôt que d'un état local :

```typescript
// PROBLÈME : Race condition avec le store
if (!user || !profile) {
  return null; // Bloque l'accès même si la session existe
}
```

Même si le `useEffect` vérifiait la session Supabase et mettait à jour le store, il y avait une **race condition** : le render pouvait se produire avant que le store soit mis à jour, bloquant ainsi l'accès.

## ✅ Solution implémentée

### 1. Layout du Dashboard (`apps/web/app/(dashboard)/layout.tsx`)

#### Changements principaux :

1. **Ajout d'un état local `isAuthorized`** pour éviter les race conditions :
   ```typescript
   const [isAuthorized, setIsAuthorized] = useState(false);
   ```

2. **Mise à jour de `isAuthorized` dans le `useEffect`** une fois que tout est vérifié :
   ```typescript
   // Après avoir vérifié la session ET le profil
   setIsAuthorized(true);
   ```

3. **Vérification finale basée sur l'état local** plutôt que sur le store :
   ```typescript
   // GARDE 2 : Vérification finale de l'autorisation
   if (!isAuthorized) {
     return null; // Redirect en cours
   }
   ```

#### Gardes d'autorisation dans le layout :

1. **GARDE 1** : `if (isChecking)` → Affiche un loader pendant la vérification
2. **GARDE 2** : `if (!isAuthorized)` → Bloque l'accès si la vérification a échoué
3. **GARDE 3** : `if (!user || !profile)` → Vérification de sécurité supplémentaire (non bloquante)

#### Conditions qui bloquent l'accès :

1. **Pas de session Supabase** :
   ```typescript
   if (!sessionUser || sessionError) {
     router.push('/login');
     return;
   }
   ```

2. **Échec de création du profil** :
   ```typescript
   if (rpcError) {
     router.push('/login');
     return;
   }
   ```

3. **Impossible de récupérer le profil après création** :
   ```typescript
   if (fetchError || !newProfile) {
     router.push('/login');
     return;
   }
   ```

4. **Pas de profil disponible après toutes les tentatives** :
   ```typescript
   if (!profile) {
     router.push('/login');
     return;
   }
   ```

### 2. Page Callback OAuth (`apps/web/app/auth/callback/page.tsx`)

#### Logique simplifiée :

1. **Vérifie la session Supabase** directement
2. **Vérifie le profil** dans `public.profiles`
3. **Crée le profil si absent** via RPC `create_or_update_profile`
4. **Met à jour le store** avec l'utilisateur et le profil
5. **Redirige vers `/dashboard`**

#### Pas de contraintes supplémentaires :

- ✅ Ne vérifie pas de workspace
- ✅ Ne vérifie pas de plan
- ✅ Ne vérifie pas d'autres champs optionnels
- ✅ Seule condition : session + profil = accès autorisé

## 📋 Flux complet

### Comment la session est récupérée :

```typescript
// Dans le layout du dashboard
const { data: { user: sessionUser }, error: sessionError } = await supabase.auth.getUser();

// On vérifie directement depuis Supabase, pas depuis le store
// Cette vérification est la source de vérité pour l'authentification
if (!sessionUser || sessionError) {
  router.push('/login');
  return;
}
```

### Comment le profil est vérifié :

```typescript
// Requête directe à Supabase pour récupérer le profil
let { data: profile, error: profileError } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', sessionUser.id)
  .single();

// Si le profil n'existe pas, création via RPC
if (profileError || !profile) {
  await supabase.rpc('create_or_update_profile', {
    user_id: sessionUser.id,
    user_email: sessionUser.email || '',
    user_username: baseUsername,
    // ... autres champs optionnels
  });
  
  // Puis récupération du profil créé
  const { data: newProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', sessionUser.id)
    .single();
}
```

### Quand un redirect est fait vers `/login` :

1. **Pas de session Supabase** (`!sessionUser || sessionError`)
   - L'utilisateur n'est pas authentifié
   - Redirection immédiate vers `/login`

2. **Échec de création du profil** (`rpcError`)
   - La fonction RPC `create_or_update_profile` a échoué
   - Impossible de continuer sans profil
   - Redirection vers `/login`

3. **Impossible de récupérer le profil après création** (`fetchError || !newProfile`)
   - Le profil a été créé mais on ne peut pas le récupérer
   - Problème de base de données ou de RLS
   - Redirection vers `/login`

4. **Pas de profil disponible après toutes les tentatives** (`!profile`)
   - Toutes les tentatives de création/récupération ont échoué
   - Redirection vers `/login`

## 🎯 Condition d'autorisation simplifiée

**L'utilisateur peut accéder au dashboard si et seulement si :**
- ✅ Une session Supabase existe (`supabase.auth.getUser()` retourne un user)
- ✅ Un profil existe dans `public.profiles` avec `id = user.id`

**Aucune autre condition n'est requise :**
- ❌ Pas besoin de workspace
- ❌ Pas besoin de plan
- ❌ Pas besoin de champs optionnels remplis
- ❌ Pas besoin que le store soit mis à jour (on utilise `isAuthorized`)

## 📝 Commentaires dans le code

Tous les gardes et conditions sont maintenant commentés pour expliquer :
- **Pourquoi** chaque vérification est nécessaire
- **Quand** chaque redirect se produit
- **Comment** la session et le profil sont récupérés

## ✅ Résultat attendu

- ✅ Les utilisateurs Google OAuth peuvent accéder au dashboard
- ✅ Pas de race condition avec le store
- ✅ Logique simple et claire : session + profil = accès autorisé
- ✅ Pas de dépendance sur des champs optionnels
- ✅ Logs de debug pour tracer chaque étape

