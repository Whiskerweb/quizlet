# Unification du client Supabase côté navigateur

## 🔍 Problème identifié

- Erreur : "Multiple GoTrueClient instances detected in the same browser context"
- Erreur : "Auth session missing!" dans le layout du dashboard
- Plusieurs instances de clients Supabase créées côté navigateur

## ✅ Solution implémentée

### 1. Client Supabase unique (`apps/web/lib/supabaseBrowserClient.ts`)

**Nouveau fichier** qui exporte une seule instance de client Supabase pour tout le front :

```typescript
export const supabaseBrowser = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
    autoRefreshToken: true,
  },
});
```

**Configuration** :
- `persistSession: true` → La session est sauvegardée dans localStorage
- `detectSessionInUrl: true` → Détecte automatiquement le hash fragment OAuth (#access_token=...)
- `autoRefreshToken: true` → Rafraîchit automatiquement le token

### 2. Page Callback simplifiée (`apps/web/app/auth/callback/page.tsx`)

**Logique simplifiée** :
- Utilise `supabaseBrowser.auth.getSession()` pour récupérer la session
- Si session présente → redirige vers `/dashboard`
- Si pas de session → redirige vers `/login`
- Pas de logique de store Zustand ni de RPC compliquée

**Logs** :
```typescript
console.log('[OAuth Callback] session', { 
  hasSession: !!session,
  userId: session?.user?.id,
  userEmail: session?.user?.email,
  error: error?.message,
});
```

### 3. Layout Dashboard simplifié (`apps/web/app/(dashboard)/layout.tsx`)

**Logique simplifiée** :
- Utilise `supabaseBrowser.auth.getSession()` pour vérifier l'authentification
- Si session présente → autorise l'accès au dashboard
- Si pas de session → redirige vers `/login`
- Ne dépend pas du store Zustand pour décider si l'utilisateur est autorisé

**Logs** :
```typescript
console.log('[Dashboard Layout] session', { 
  hasSession: !!session,
  userId: session?.user?.id,
  userEmail: session?.user?.email,
  error: error?.message,
});
```

## 📋 Fichiers modifiés

1. **`apps/web/lib/supabaseBrowserClient.ts`** (nouveau)
   - Client Supabase unique pour le navigateur

2. **`apps/web/app/auth/callback/page.tsx`**
   - Simplifié pour utiliser `getSession()` uniquement
   - Pas de logique de store ni de RPC

3. **`apps/web/app/(dashboard)/layout.tsx`**
   - Simplifié pour utiliser `getSession()` uniquement
   - Ne dépend pas du store pour l'autorisation

4. **`apps/web/components/auth/GoogleLoginButton.tsx`**
   - Mis à jour pour utiliser `supabaseBrowser` au lieu de `supabaseClient`

## 🔄 Flux simplifié

### Pour un utilisateur Google OAuth :

1. **Clic sur "Continuer avec Google"** → Redirection vers Google
2. **Authentification Google** → Redirection vers `/auth/callback`
3. **Page callback** :
   - Appelle `supabaseBrowser.auth.getSession()`
   - Si session présente → redirige vers `/dashboard`
   - Si pas de session → redirige vers `/login`
4. **Layout dashboard** :
   - Appelle `supabaseBrowser.auth.getSession()`
   - Si session présente → autorise l'accès
   - Si pas de session → redirige vers `/login`

## ✅ Vérifications

Après les modifications :

- ✅ Un seul `createClient()` utilisé côté navigateur (`supabaseBrowser`)
- ✅ `/auth/callback` loggue bien une session, puis redirige vers `/dashboard`
- ✅ Sur `/dashboard`, `[Dashboard Layout] session` affiche bien une session (pas "Auth session missing!")
- ✅ Plus d'erreur "Multiple GoTrueClient instances detected"

## 📝 Notes importantes

- **Le store Zustand continue d'exister** mais n'est plus utilisé pour décider si l'utilisateur est autorisé
- **Le profil n'est pas vérifié** dans le callback ni le layout pour simplifier le flux
- **Le trigger SQL `handle_new_user()`** crée automatiquement le profil lors de la création de l'utilisateur
- **Si le profil n'existe pas**, il sera créé automatiquement par le trigger, pas besoin de le vérifier dans le code front



