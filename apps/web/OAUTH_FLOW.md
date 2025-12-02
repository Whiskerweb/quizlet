# Flux OAuth Google - Documentation

## 📋 Vue d'ensemble

Ce document explique le flux complet d'authentification OAuth avec Google dans l'application CARDZ.

## 🔄 Flux complet

### 1. Clic sur "Continuer avec Google"
- **Fichier** : `apps/web/components/auth/GoogleLoginButton.tsx`
- **Action** : L'utilisateur clique sur le bouton "Continuer avec Google" sur la page de login (`/login`)
- **Code exécuté** :
  ```typescript
  await supabaseClient.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'https://cardz.dev/auth/callback', // En production
      queryParams: {
        redirect_to: '/dashboard', // Où rediriger après connexion
      },
    },
  });
  ```
- **Résultat** : Supabase redirige automatiquement l'utilisateur vers Google

### 2. Authentification Google
- **Action** : L'utilisateur s'authentifie avec son compte Google
- **Résultat** : Google redirige vers le callback Supabase : `https://vbqvhumwsbezoipaexsw.supabase.co/auth/v1/callback`
- **Note** : Cette URL est configurée dans Google Cloud Console

### 3. Callback Supabase → Application
- **Action** : Supabase traite la réponse de Google et redirige vers notre application
- **URL de redirection** : `https://cardz.dev/auth/callback#access_token=...&refresh_token=...`
- **Note** : Le hash fragment (`#access_token=...`) contient les tokens d'authentification

### 4. Page `/auth/callback`
- **Fichier** : `apps/web/app/auth/callback/page.tsx`
- **Action** : Cette page traite le callback OAuth
- **Étapes** :
  1. **Vérification de la session** : Appel à `supabaseClient.auth.getSession()`
     - Si une session existe déjà → traitement immédiat
     - Sinon → écoute via `onAuthStateChange`
  
  2. **Détection de la session** : Via `onAuthStateChange` qui écoute l'événement `SIGNED_IN`
     - Supabase traite automatiquement le hash fragment et crée la session
  
  3. **Récupération du profil** :
     - Si le profil existe → récupération depuis la table `profiles`
     - Si le profil n'existe pas → création automatique
  
  4. **Mise à jour du store** : Mise à jour de `authStore` avec l'utilisateur et le profil
  
  5. **Redirection** : Redirection vers `/dashboard` (ou l'URL spécifiée dans `redirect_to`)

### 5. Dashboard protégé
- **Fichier** : `apps/web/app/(dashboard)/layout.tsx`
- **Protection** : Le layout vérifie l'authentification au montage
- **Code** :
  ```typescript
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    router.push('/login');
    return;
  }
  ```
- **Résultat** : Si l'utilisateur n'est pas authentifié, redirection vers `/login`

## 📁 Fichiers modifiés/créés

### 1. Client Supabase OAuth
**Fichier** : `apps/web/lib/supabase/supabaseClient.ts`
- Client Supabase standard pour l'authentification OAuth
- Utilise `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Configuration : `detectSessionInUrl: true` pour détecter automatiquement le hash fragment

### 2. Composant GoogleLoginButton
**Fichier** : `apps/web/components/auth/GoogleLoginButton.tsx`
- **Modifications** :
  - Utilisation de l'URL de production (`https://cardz.dev/auth/callback`) en production
  - Utilisation de `window.location.origin` en développement
  - Gestion des erreurs avec affichage dans l'UI

### 3. Page de callback OAuth
**Fichier** : `apps/web/app/auth/callback/page.tsx`
- **Fonctionnalités** :
  - Vérification immédiate de la session avec `getSession()`
  - Écoute des changements d'authentification avec `onAuthStateChange`
  - Création automatique du profil si nécessaire
  - Redirection vers `/dashboard` après connexion réussie
  - Gestion des erreurs avec timeout de sécurité (10 secondes)

### 4. Protection du dashboard
**Fichier** : `apps/web/app/(dashboard)/layout.tsx`
- **Protection existante** : Le layout vérifie déjà l'authentification
- **Fonctionnement** :
  - Au montage, vérification de la session avec `supabase.auth.getUser()`
  - Si pas de session → redirection vers `/login`
  - Si session présente → affichage du dashboard

## 🔑 Points importants

### URL de callback
- **Production** : `https://cardz.dev/auth/callback`
- **Développement** : `http://localhost:3000/auth/callback`
- **Configuration Supabase** : Cette URL doit être ajoutée dans Supabase Dashboard > Authentication > URL Configuration > Redirect URLs

### Hash fragment
- Supabase OAuth utilise un hash fragment (`#access_token=...`) dans l'URL
- Le client Supabase détecte automatiquement ce hash grâce à `detectSessionInUrl: true`
- La session est créée automatiquement, pas besoin de traitement manuel

### Redirection
- Utilisation de `router.replace()` au lieu de `router.push()` pour éviter d'ajouter une entrée dans l'historique
- Redirection par défaut vers `/dashboard` si aucun paramètre `redirect_to` n'est fourni

### Protection du dashboard
- Le layout du dashboard vérifie l'authentification au montage
- Si l'utilisateur n'est pas authentifié, redirection automatique vers `/login`
- Pas besoin de protection supplémentaire sur les pages individuelles du dashboard

## 🐛 Dépannage

### L'utilisateur n'est pas redirigé vers le dashboard
1. Vérifier que l'URL de callback est correcte dans `GoogleLoginButton.tsx`
2. Vérifier que l'URL est bien configurée dans Supabase Dashboard
3. Vérifier les logs de la console pour les erreurs
4. Vérifier que le timeout (10 secondes) n'est pas déclenché

### La session n'est pas détectée
1. Vérifier que `detectSessionInUrl: true` est bien configuré dans `supabaseClient.ts`
2. Vérifier que le hash fragment est présent dans l'URL après la redirection
3. Vérifier les logs de `onAuthStateChange` pour voir si l'événement `SIGNED_IN` est déclenché

### Le profil n'est pas créé
1. Vérifier que la table `profiles` existe dans Supabase
2. Vérifier que les triggers de création de profil sont actifs
3. Vérifier les logs pour les erreurs de création de profil

## 📝 Notes techniques

- **App Router** : Le projet utilise Next.js App Router (dossier `app/`)
- **Client Supabase** : Utilisation de `@supabase/supabase-js` pour OAuth (pas le client SSR)
- **Store** : Utilisation de Zustand (`authStore`) pour gérer l'état d'authentification
- **Suspense** : La page de callback utilise `Suspense` pour `useSearchParams()` (requis par Next.js 14)

