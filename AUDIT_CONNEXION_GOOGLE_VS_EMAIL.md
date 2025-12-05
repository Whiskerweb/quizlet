# 🔍 Audit Complet : Connexion Google OAuth vs Connexion Email/Mot de Passe

**Date de l'audit** : 2024  
**Problème identifié** : Les utilisateurs connectés via Google OAuth n'ont pas de profil fonctionnel, ne peuvent pas partager leurs sets, ni accéder à leur page de profil.

---

## 📋 Résumé Exécutif

### Problème Principal
Les utilisateurs connectés via Google OAuth ont bien une session Supabase valide et un profil créé dans la base de données, **MAIS** le profil n'est jamais chargé dans le store Zustand (`authStore`), ce qui empêche l'application de fonctionner correctement.

### Impact
- ❌ Impossible d'accéder à sa page de profil (`/profile/[username]`)
- ❌ Impossible de partager des sets
- ❌ L'application se comporte comme si l'utilisateur était en mode "lecture seule"
- ✅ Les sets peuvent être créés (car la session existe)
- ✅ Les utilisateurs existent bien dans Supabase avec un ID client

---

## 🔄 Comparaison des Flux d'Authentification

### 1. Connexion Email/Mot de Passe (`/login`)

**Fichier** : `apps/web/app/(auth)/login/page.tsx`

#### Flux Complet :
1. ✅ L'utilisateur saisit email + mot de passe
2. ✅ Appel à `supabase.auth.signInWithPassword()`
3. ✅ **Récupération du profil depuis la base de données** :
   ```typescript
   const { data: profile, error: profileError } = await supabase
     .from('profiles')
     .select('*')
     .eq('id', authData.user.id)
     .single();
   ```
4. ✅ **Mise à jour du store Zustand** :
   ```typescript
   setUser(authData.user);
   setProfile(profile);
   ```
5. ✅ Redirection vers `/dashboard` avec le profil chargé

#### Points Clés :
- ✅ Le profil est **explicitement chargé** depuis Supabase
- ✅ Le profil est **mis à jour dans le store Zustand**
- ✅ L'utilisateur arrive sur le dashboard avec `user` ET `profile` dans le store

---

### 2. Inscription Email/Mot de Passe (`/register`)

**Fichier** : `apps/web/app/(auth)/register/page.tsx`

#### Flux Complet :
1. ✅ L'utilisateur saisit email + username + mot de passe
2. ✅ Appel à `supabase.auth.signUp()` avec metadata (username, first_name, last_name)
3. ✅ Attente de 500ms pour le trigger SQL (`handle_new_user()`)
4. ✅ **Création/mise à jour du profil via RPC** :
   ```typescript
   await (supabase.rpc as any)('create_or_update_profile', {
     user_id: authData.user.id,
     user_email: data.email,
     user_username: data.username,
     user_first_name: data.firstName || null,
     user_last_name: data.lastName || null,
   });
   ```
5. ✅ **Récupération du profil créé** :
   ```typescript
   const { data: profile, error: fetchError } = await supabase
     .from('profiles')
     .select('*')
     .eq('id', authData.user.id)
     .single();
   ```
6. ✅ **Mise à jour du store Zustand** :
   ```typescript
   setUser(authData.user);
   setProfile(profile);
   ```
7. ✅ Redirection vers `/dashboard` avec le profil chargé

#### Points Clés :
- ✅ Le profil est **créé explicitement** via RPC
- ✅ Le profil est **récupéré** depuis Supabase
- ✅ Le profil est **mis à jour dans le store Zustand**
- ✅ L'utilisateur arrive sur le dashboard avec `user` ET `profile` dans le store

---

### 3. Connexion Google OAuth (`/auth/callback`)

**Fichier** : `apps/web/app/auth/callback/page.tsx`

#### Flux Complet :
1. ✅ L'utilisateur clique sur "Continuer avec Google"
2. ✅ Redirection vers Google pour authentification
3. ✅ Google redirige vers `/auth/callback` avec hash fragment (`#access_token=...`)
4. ✅ Supabase détecte automatiquement le token et crée la session
5. ✅ **Vérification de la session** :
   ```typescript
   const { data: { session }, error } = await supabaseBrowser.auth.getSession();
   ```
6. ❌ **PROBLÈME : Aucun chargement du profil**
7. ❌ **PROBLÈME : Aucune mise à jour du store Zustand**
8. ✅ Redirection vers `/dashboard` **SANS** profil dans le store

#### Points Clés :
- ❌ Le profil **n'est jamais chargé** depuis Supabase
- ❌ Le profil **n'est jamais mis à jour** dans le store Zustand
- ❌ L'utilisateur arrive sur le dashboard avec seulement `user` dans le store, **mais `profile` est `null`**
- ⚠️ Le trigger SQL `handle_new_user()` crée bien le profil dans la base de données, mais il n'est pas accessible côté client

---

## 🔍 Analyse du Layout Dashboard

**Fichier** : `apps/web/app/(dashboard)/layout.tsx`

### Comportement Actuel :

```typescript
// Vérification de l'authentification
useEffect(() => {
  const run = async () => {
    const { data: { session }, error } = await supabaseBrowser.auth.getSession();
    
    if (!session || error) {
      router.replace('/login');
      return;
    }
    
    // Session présente → autoriser l'accès au dashboard
    // On ne vérifie pas le profil ici pour simplifier
    setAuthorized(true);
    setChecking(false);
  };
  run();
}, [router]);
```

### Problèmes Identifiés :

1. ❌ **Aucune vérification du profil** : Le layout vérifie seulement la session, pas le profil
2. ❌ **Aucun chargement du profil** : Le profil n'est jamais chargé depuis Supabase
3. ❌ **Aucune mise à jour du store** : Le store Zustand n'est jamais mis à jour avec le profil
4. ⚠️ **Commentaire trompeur** : "Le profil peut être vérifié/créé ailleurs si nécessaire" → **MAIS ce n'est jamais fait**

### Utilisation du Profil dans le Layout :

```typescript
const { user, profile, logout } = useAuthStore();

// Dans le JSX :
<Link href={`/profile/${profile?.username || 'me'}`}>
  <span>{profile?.username || user?.email?.split('@')[0] || 'User'}</span>
</Link>
```

**Problème** : `profile` est toujours `null` pour les utilisateurs Google OAuth, donc :
- Le lien vers le profil pointe vers `/profile/me` (qui n'existe probablement pas)
- Le nom d'utilisateur affiché est l'email au lieu du username

---

## 🔍 Analyse du Store d'Authentification

**Fichier** : `apps/web/store/authStore.ts`

### Structure du Store :

```typescript
interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => Promise<void>;
  isAuthenticated: () => boolean;
}
```

### Méthode `isAuthenticated()` :

```typescript
isAuthenticated: () => {
  const state = get();
  return state.user !== null && state.profile !== null;
}
```

**Problème** : Pour les utilisateurs Google OAuth, `profile` est toujours `null`, donc `isAuthenticated()` retourne toujours `false`, même si l'utilisateur a une session valide.

### Initialisation du Store :

```typescript
export const useAuthStore = create<AuthState>((set, get) => {
  return {
    user: null,
    profile: null,
    loading: true,
    // ...
  };
});
```

**Problème** : Le store est initialisé avec `user: null` et `profile: null`. Il n'y a **aucun mécanisme** pour charger automatiquement le profil depuis la session Supabase au démarrage de l'application.

---

## 🔍 Analyse des Politiques RLS (Row Level Security)

**Fichier** : `supabase/schema.sql`

### Politiques pour la Table `profiles` :

```sql
-- Policy: Users can view their own profile
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy: Public profiles are viewable by everyone
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);
```

### Analyse :

✅ **Les politiques RLS sont correctes** :
- Les utilisateurs peuvent lire leur propre profil (`auth.uid() = id`)
- Les profils publics peuvent être lus par tout le monde (`USING (true)`)

❌ **Le problème n'est PAS les politiques RLS**, mais le fait que le profil n'est jamais chargé dans le store.

---

## 🔍 Analyse du Trigger SQL pour la Création de Profil

**Fichier** : `supabase/ensure_google_oauth_profiles.sql`

### Fonction `handle_new_user()` :

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, first_name, last_name, is_premium)
  VALUES (
    NEW.id,
    NEW.email,
    final_username,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Trigger :

```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### Analyse :

✅ **Le trigger fonctionne correctement** :
- Il crée automatiquement un profil quand un utilisateur est créé dans `auth.users`
- Il fonctionne pour les utilisateurs Google OAuth ET email/password
- Le profil est bien créé dans la base de données

❌ **MAIS** : Le profil créé par le trigger n'est jamais chargé dans le store Zustand côté client.

---

## 🔍 Analyse de la Page de Profil

**Fichier** : `apps/web/app/(dashboard)/profile/[username]/page.tsx`

### Comportement :

```typescript
const { profile: currentProfile, user } = useAuthStore();
const isOwnProfile = currentProfile?.username === username;
```

**Problème** : Pour les utilisateurs Google OAuth, `currentProfile` est `null`, donc :
- `isOwnProfile` est toujours `false`
- L'utilisateur ne peut pas accéder à sa propre page de profil
- Les fonctionnalités réservées au propriétaire ne sont pas accessibles

### Chargement du Profil :

```typescript
const loadProfile = async () => {
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();
  
  setProfile(profileData);
};
```

**Note** : Cette fonction charge le profil d'un **autre utilisateur** (par username), pas le profil de l'utilisateur connecté. Elle fonctionne grâce à la politique RLS "Public profiles are viewable by everyone".

---

## 🔍 Analyse du Partage de Sets

**Fichier** : `apps/web/lib/supabase/shared-sets.ts`

### Fonction `getMySharedSets()` :

```typescript
async getMySharedSets(): Promise<SharedSetWithDetails[]> {
  const { data: { session } } = await supabaseBrowser.auth.getSession();
  if (!session?.user) {
    throw new Error('User not authenticated');
  }
  
  const user = session.user;
  // ...
}
```

**Analyse** : Cette fonction utilise directement `session.user` au lieu du store, donc elle devrait fonctionner même si le profil n'est pas dans le store.

### Fonction `shareSetWithUser()` :

```typescript
async shareSetWithUser(setId: string, targetUserId: string): Promise<void> {
  const { data: { session } } = await supabaseBrowser.auth.getSession();
  if (!session?.user) {
    throw new Error('User not authenticated');
  }
  
  // Vérifie que l'utilisateur possède le set
  const { data: setData } = await supabaseBrowser
    .from('sets')
    .select('user_id')
    .eq('id', setId)
    .single();
  
  if (setData.user_id !== session.user.id) {
    throw new Error('You do not own this set');
  }
  // ...
}
```

**Analyse** : Cette fonction devrait fonctionner car elle utilise `session.user.id` directement.

### Problème Potentiel :

Si le composant qui appelle ces fonctions vérifie `isAuthenticated()` depuis le store, il pourrait bloquer l'accès car `isAuthenticated()` retourne `false` pour les utilisateurs Google OAuth.

---

## 📊 Tableau Comparatif

| Aspect | Email/Password Login | Email/Password Register | Google OAuth |
|--------|---------------------|-------------------------|--------------|
| **Création de session** | ✅ `signInWithPassword()` | ✅ `signUp()` | ✅ `signInWithOAuth()` |
| **Création de profil (trigger SQL)** | ✅ Automatique | ✅ Automatique | ✅ Automatique |
| **Chargement du profil** | ✅ **Explicite** | ✅ **Explicite** | ❌ **JAMAIS FAIT** |
| **Mise à jour du store** | ✅ `setUser()` + `setProfile()` | ✅ `setUser()` + `setProfile()` | ❌ **JAMAIS FAIT** |
| **Profil dans le store après connexion** | ✅ **Oui** | ✅ **Oui** | ❌ **Non (null)** |
| **Accès au dashboard** | ✅ Oui | ✅ Oui | ✅ Oui (mais sans profil) |
| **Accès à sa page de profil** | ✅ Oui | ✅ Oui | ❌ Non |
| **Partage de sets** | ✅ Oui | ✅ Oui | ❌ Probablement non |
| **`isAuthenticated()` retourne** | ✅ `true` | ✅ `true` | ❌ `false` |

---

## 🎯 Problèmes Identifiés (Priorisés)

### 🔴 CRITIQUE - Problème #1 : Profil jamais chargé dans le store après OAuth

**Localisation** : `apps/web/app/auth/callback/page.tsx`

**Description** :
- Après la connexion Google OAuth, le callback redirige vers `/dashboard` sans charger le profil
- Le profil existe dans Supabase (créé par le trigger), mais n'est jamais chargé dans le store Zustand
- Résultat : `profile` est toujours `null` dans le store

**Impact** :
- `isAuthenticated()` retourne `false`
- Impossible d'accéder à sa page de profil
- Le nom d'utilisateur n'est pas affiché correctement
- Fonctionnalités dépendantes du profil ne fonctionnent pas

**Solution Recommandée** :
Ajouter le chargement du profil dans le callback OAuth, similaire à ce qui est fait dans `/login` :

```typescript
// Après avoir vérifié la session
const { data: profile, error: profileError } = await supabaseBrowser
  .from('profiles')
  .select('*')
  .eq('id', session.user.id)
  .single();

if (profileError) {
  // Créer le profil si nécessaire via RPC
  await supabaseBrowser.rpc('create_or_update_profile', { ... });
}

// Mettre à jour le store
setUser(session.user);
setProfile(profile);
```

---

### 🔴 CRITIQUE - Problème #2 : Pas d'initialisation du store au chargement

**Localisation** : `apps/web/app/(dashboard)/layout.tsx`

**Description** :
- Le layout vérifie seulement la session, pas le profil
- Si l'utilisateur rafraîchit la page ou arrive directement sur `/dashboard`, le profil n'est jamais chargé
- Même problème pour les utilisateurs email/password après un refresh

**Impact** :
- Après un refresh, `profile` est `null` même pour les utilisateurs email/password
- L'application ne fonctionne pas correctement après un refresh

**Solution Recommandée** :
Charger le profil dans le layout du dashboard si la session existe mais le profil n'est pas dans le store :

```typescript
if (session && !profile) {
  // Charger le profil
  const { data: profileData } = await supabaseBrowser
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();
  
  if (profileData) {
    setUser(session.user);
    setProfile(profileData);
  }
}
```

---

### 🟡 MOYEN - Problème #3 : `isAuthenticated()` dépend du profil

**Localisation** : `apps/web/store/authStore.ts`

**Description** :
- `isAuthenticated()` vérifie que `user` ET `profile` sont non-null
- Pour les utilisateurs Google OAuth, `profile` est toujours `null`, donc `isAuthenticated()` retourne toujours `false`
- Certains composants pourraient utiliser cette méthode pour vérifier l'authentification

**Impact** :
- Composants qui utilisent `isAuthenticated()` bloquent les utilisateurs Google OAuth
- Incohérence : l'utilisateur a une session valide mais n'est pas considéré comme authentifié

**Solution Recommandée** :
Vérifier seulement la session Supabase, pas le profil :

```typescript
isAuthenticated: async () => {
  const { data: { session } } = await supabaseBrowser.auth.getSession();
  return !!session;
}
```

OU charger le profil automatiquement si la session existe mais le profil n'est pas chargé.

---

### 🟢 FAIBLE - Problème #4 : Commentaires trompeurs

**Localisation** : `apps/web/app/(dashboard)/layout.tsx`

**Description** :
- Commentaire : "Le profil peut être vérifié/créé ailleurs si nécessaire"
- En réalité, le profil n'est jamais vérifié/créé ailleurs

**Impact** :
- Confusion pour les développeurs
- Pas d'impact fonctionnel

---

## 🔧 Solutions Recommandées

### Solution 1 : Corriger le Callback OAuth (PRIORITÉ HAUTE)

**Fichier** : `apps/web/app/auth/callback/page.tsx`

**Changements** :
1. Après avoir vérifié la session, charger le profil depuis Supabase
2. Si le profil n'existe pas, le créer via RPC `create_or_update_profile`
3. Mettre à jour le store Zustand avec `user` et `profile`
4. Ensuite rediriger vers `/dashboard`

**Code à ajouter** :
```typescript
// Après avoir vérifié la session
const { data: profile, error: profileError } = await supabaseBrowser
  .from('profiles')
  .select('*')
  .eq('id', session.user.id)
  .single();

if (profileError || !profile) {
  // Créer le profil si nécessaire
  const baseUsername = session.user.email?.split('@')[0] || `user_${session.user.id.substring(0, 8)}`;
  
  const { error: rpcError } = await (supabaseBrowser.rpc as any)('create_or_update_profile', {
    user_id: session.user.id,
    user_email: session.user.email || '',
    user_username: baseUsername,
    user_first_name: session.user.user_metadata?.first_name || null,
    user_last_name: session.user.user_metadata?.last_name || null,
  });
  
  if (rpcError) {
    console.error('Error creating profile:', rpcError);
    // Continuer quand même, le trigger SQL devrait avoir créé le profil
  }
  
  // Récupérer le profil créé
  const { data: newProfile } = await supabaseBrowser
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();
  
  if (newProfile) {
    setUser(session.user);
    setProfile(newProfile);
  }
} else {
  // Profil existe, mettre à jour le store
  setUser(session.user);
  setProfile(profile);
}
```

---

### Solution 2 : Initialiser le Store dans le Layout Dashboard (PRIORITÉ HAUTE)

**Fichier** : `apps/web/app/(dashboard)/layout.tsx`

**Changements** :
1. Après avoir vérifié la session, vérifier si le profil est dans le store
2. Si le profil n'est pas dans le store, le charger depuis Supabase
3. Mettre à jour le store avec `user` et `profile`

**Code à ajouter** :
```typescript
// Après avoir vérifié la session
if (session) {
  // Vérifier si le profil est dans le store
  const currentProfile = useAuthStore.getState().profile;
  
  if (!currentProfile || currentProfile.id !== session.user.id) {
    // Charger le profil
    const { data: profileData, error: profileError } = await supabaseBrowser
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    if (profileData) {
      useAuthStore.getState().setUser(session.user);
      useAuthStore.getState().setProfile(profileData);
    } else if (profileError) {
      console.error('Error loading profile:', profileError);
      // Créer le profil si nécessaire
      // ... (même logique que dans le callback)
    }
  } else {
    // Profil déjà dans le store, mettre à jour user si nécessaire
    useAuthStore.getState().setUser(session.user);
  }
  
  setAuthorized(true);
  setChecking(false);
}
```

---

### Solution 3 : Créer un Hook d'Initialisation (PRIORITÉ MOYENNE)

**Fichier** : `apps/web/hooks/useAuthInit.ts` (nouveau fichier)

**Description** :
Créer un hook React qui initialise automatiquement le store d'authentification au chargement de l'application.

**Avantages** :
- Réutilisable dans plusieurs composants
- Centralise la logique d'initialisation
- Facilite la maintenance

---

## 📝 Checklist de Vérification

Pour vérifier que les problèmes sont résolus, tester les scénarios suivants :

### Scénario 1 : Connexion Google OAuth (Nouvel Utilisateur)
- [ ] L'utilisateur clique sur "Continuer avec Google"
- [ ] L'utilisateur s'authentifie avec Google
- [ ] Redirection vers `/dashboard`
- [ ] Le profil est chargé dans le store (`profile` n'est pas `null`)
- [ ] Le nom d'utilisateur est affiché dans le header
- [ ] L'utilisateur peut accéder à sa page de profil (`/profile/[username]`)
- [ ] L'utilisateur peut créer un set
- [ ] L'utilisateur peut partager un set

### Scénario 2 : Connexion Google OAuth (Utilisateur Existant)
- [ ] L'utilisateur clique sur "Continuer avec Google"
- [ ] L'utilisateur s'authentifie avec Google
- [ ] Redirection vers `/dashboard`
- [ ] Le profil existant est chargé dans le store
- [ ] Toutes les fonctionnalités fonctionnent

### Scénario 3 : Refresh de la Page (Utilisateur Google OAuth)
- [ ] L'utilisateur est connecté via Google OAuth
- [ ] L'utilisateur rafraîchit la page (`F5`)
- [ ] Le profil est rechargé automatiquement dans le store
- [ ] Toutes les fonctionnalités continuent de fonctionner

### Scénario 4 : Accès Direct au Dashboard (Utilisateur Google OAuth)
- [ ] L'utilisateur est connecté via Google OAuth
- [ ] L'utilisateur ferme l'onglet
- [ ] L'utilisateur ouvre directement `/dashboard` dans un nouvel onglet
- [ ] Le profil est chargé automatiquement
- [ ] Toutes les fonctionnalités fonctionnent

---

## 🔍 Points d'Attention Supplémentaires

### 1. Gestion des Erreurs
- Que se passe-t-il si le profil n'existe pas dans Supabase malgré le trigger ?
- Que se passe-t-il si la création du profil via RPC échoue ?
- Faut-il afficher un message d'erreur à l'utilisateur ou rediriger vers une page d'erreur ?

### 2. Performance
- Le chargement du profil ajoute une requête supplémentaire au callback OAuth
- Est-ce que cela impacte les performances ?
- Faut-il mettre en cache le profil ?

### 3. Synchronisation
- Que se passe-t-il si le profil est modifié dans Supabase pendant que l'utilisateur est connecté ?
- Faut-il rafraîchir le profil périodiquement ?

### 4. Tests
- Ajouter des tests unitaires pour vérifier le chargement du profil
- Ajouter des tests d'intégration pour le flux OAuth complet
- Tester avec différents scénarios (nouvel utilisateur, utilisateur existant, erreurs)

---

## 📚 Références

### Fichiers Clés Analysés :
- `apps/web/app/auth/callback/page.tsx` - Callback OAuth
- `apps/web/app/(auth)/login/page.tsx` - Login email/password
- `apps/web/app/(auth)/register/page.tsx` - Register email/password
- `apps/web/app/(dashboard)/layout.tsx` - Layout dashboard
- `apps/web/store/authStore.ts` - Store Zustand
- `supabase/ensure_google_oauth_profiles.sql` - Trigger SQL
- `supabase/schema.sql` - Schéma et politiques RLS

### Documentation Supabase :
- [Supabase Auth - OAuth](https://supabase.com/docs/guides/auth/social-login)
- [Supabase Auth - Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

## ✅ Conclusion

Le problème principal est que **le profil n'est jamais chargé dans le store Zustand après la connexion Google OAuth**, contrairement aux connexions email/password où le profil est explicitement chargé et mis à jour dans le store.

**Les solutions recommandées** :
1. ✅ Corriger le callback OAuth pour charger le profil
2. ✅ Initialiser le store dans le layout dashboard
3. ✅ Améliorer la méthode `isAuthenticated()` pour ne pas dépendre uniquement du profil

Une fois ces corrections appliquées, les utilisateurs Google OAuth devraient avoir le même comportement que les utilisateurs email/password.


