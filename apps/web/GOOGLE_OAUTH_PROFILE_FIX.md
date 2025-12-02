# Fix : Création automatique de profil pour les utilisateurs Google OAuth

## 🔍 Problème identifié

Les utilisateurs créés via Google OAuth n'avaient pas de profil créé automatiquement, contrairement aux utilisateurs email/password. Cela causait des problèmes d'accès au dashboard.

## ✅ Solution implémentée

### 1. Modification de la page `/auth/callback`

**Fichier** : `apps/web/app/auth/callback/page.tsx`

**Changements** :
- Utilisation de la fonction RPC `create_or_update_profile` au lieu d'un `INSERT` direct
- Cette fonction bypass RLS et gère les conflits de username automatiquement
- Même logique que pour les utilisateurs email/password

**Code** :
```typescript
// Utiliser la fonction RPC create_or_update_profile qui bypass RLS
const { error: rpcError } = await supabaseClient.rpc('create_or_update_profile', {
  user_id: user.id,
  user_email: user.email || '',
  user_username: baseUsername,
  user_first_name: user.user_metadata?.first_name || null,
  user_last_name: user.user_metadata?.last_name || null,
});
```

### 2. Protection supplémentaire dans le layout du dashboard

**Fichier** : `apps/web/app/(dashboard)/layout.tsx`

**Changements** :
- Vérification de l'existence du profil au chargement du dashboard
- Création automatique du profil si absent (via RPC)
- Sécurité supplémentaire au cas où le trigger SQL ne fonctionnerait pas

### 3. Script SQL pour garantir la configuration

**Fichier** : `supabase/ensure_google_oauth_profiles.sql`

**Contenu** :
- Fonction `handle_new_user()` : Crée automatiquement un profil lors de la création d'un utilisateur
- Trigger `on_auth_user_created` : Attaché à `auth.users` pour déclencher la création de profil
- Fonction RPC `create_or_update_profile` : Permet de créer/mettre à jour un profil en bypassant RLS
- RLS Policies : Permettent aux utilisateurs de lire/mettre à jour leur propre profil

## 🔄 Flux pour un nouvel utilisateur Google

### Étape 1 : Authentification Google
1. L'utilisateur clique sur "Continuer avec Google"
2. Redirection vers Google OAuth
3. Authentification réussie
4. Google redirige vers Supabase callback

### Étape 2 : Création de l'utilisateur dans Supabase
1. Supabase crée l'utilisateur dans `auth.users`
2. **Trigger SQL** : `on_auth_user_created` se déclenche automatiquement
3. **Fonction** : `handle_new_user()` crée un profil dans `public.profiles`
   - Username généré à partir de l'email (ex: `john.doe@gmail.com` → `john.doe`)
   - Si le username existe déjà, ajout d'un numéro (ex: `john.doe_1`)
   - Email, first_name, last_name récupérés depuis les métadonnées Google

### Étape 3 : Callback OAuth (`/auth/callback`)
1. La page vérifie si un profil existe
2. Si le profil n'existe pas (trigger échoué) :
   - Appel de `create_or_update_profile` via RPC
   - Création du profil avec gestion des conflits de username
3. Mise à jour du store d'authentification
4. Redirection vers `/dashboard`

### Étape 4 : Dashboard
1. Le layout vérifie l'authentification
2. Si le profil n'existe toujours pas (double sécurité) :
   - Création automatique via RPC
3. Affichage du dashboard

## 📋 Fichiers modifiés

1. **`apps/web/app/auth/callback/page.tsx`**
   - Utilisation de `create_or_update_profile` RPC au lieu d'INSERT direct
   - Meilleure gestion des erreurs

2. **`apps/web/app/(dashboard)/layout.tsx`**
   - Vérification et création du profil si absent
   - Protection supplémentaire

3. **`supabase/ensure_google_oauth_profiles.sql`** (nouveau)
   - Script SQL pour garantir la configuration
   - Trigger, fonction RPC, et RLS policies

## 🔧 Installation

Pour appliquer les changements SQL dans Supabase :

1. Allez dans Supabase Dashboard → SQL Editor
2. Exécutez le fichier `supabase/ensure_google_oauth_profiles.sql`
3. Vérifiez que le trigger et les fonctions sont créés

## ✅ Vérification

### Vérifier que le trigger existe :
```sql
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
```

### Vérifier que la fonction RPC existe :
```sql
SELECT * FROM information_schema.routines 
WHERE routine_name = 'create_or_update_profile';
```

### Vérifier les RLS policies :
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'profiles';
```

## 🎯 Résultat attendu

- ✅ Les utilisateurs Google OAuth ont automatiquement un profil créé
- ✅ Le profil est créé soit par le trigger SQL, soit par la fonction RPC
- ✅ Les utilisateurs peuvent accéder au dashboard sans problème
- ✅ Les RLS policies permettent la lecture/mise à jour du profil

