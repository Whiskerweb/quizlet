# Configuration de l'authentification Google avec Supabase

Ce document explique comment configurer et utiliser l'authentification Google dans l'application CARDZ.

## 📋 Prérequis

1. **Supabase configuré** : Votre projet Supabase doit être configuré avec le provider Google
2. **Variables d'environnement** : Les variables `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` doivent être définies
3. **URL de callback configurée** : L'URL `https://cardz.dev/auth/callback` doit être ajoutée dans Supabase Dashboard

## 🔧 Configuration Supabase

### 1. Configuration dans Supabase Dashboard

1. Allez dans votre projet Supabase Dashboard
2. Naviguez vers **Authentication** > **Providers**
3. Activez le provider **Google**
4. Configurez les **Client ID** et **Client Secret** de Google OAuth
5. Dans **Authentication** > **URL Configuration**, ajoutez :
   - **Redirect URLs** : `https://cardz.dev/auth/callback`
   - **Site URL** : `https://cardz.dev`

### 2. Configuration Google Cloud Console

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un projet ou sélectionnez un projet existant
3. Activez l'API **Google+ API**
4. Créez des **Credentials** > **OAuth 2.0 Client ID**
5. Configurez :
   - **Authorized redirect URIs** : `https://vbqvhumwsbezoipaexsw.supabase.co/auth/v1/callback`
   - **Authorized JavaScript origins** : `https://vbqvhumwsbezoipaexsw.supabase.co`
6. Copiez le **Client ID** et **Client Secret** dans Supabase

## 📁 Structure des fichiers

```
apps/web/
├── lib/
│   └── supabase/
│       └── supabaseClient.ts          # Client Supabase pour OAuth
├── components/
│   └── auth/
│       └── GoogleLoginButton.tsx      # Composant bouton Google
└── app/
    └── auth/
        └── callback/
            └── page.tsx                # Page de callback OAuth
```

## 🔑 Variables d'environnement

Assurez-vous d'avoir ces variables dans votre fichier `.env.local` :

```env
NEXT_PUBLIC_SUPABASE_URL=https://vbqvhumwsbezoipaexsw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon_ici
```

## 🚀 Utilisation

### Dans une page de login/register

```tsx
import { GoogleLoginButton } from '@/components/auth/GoogleLoginButton';

// Dans votre composant
<GoogleLoginButton 
  redirectTo="/dashboard"  // Optionnel : où rediriger après connexion
  label="Continuer avec Google"  // Optionnel : texte du bouton
/>
```

### Flux d'authentification

1. **Utilisateur clique sur "Continuer avec Google"**
   - Le composant `GoogleLoginButton` appelle `supabaseClient.auth.signInWithOAuth()`
   - L'utilisateur est redirigé vers Google pour s'authentifier

2. **Authentification Google**
   - Google demande à l'utilisateur de se connecter
   - L'utilisateur autorise l'application

3. **Callback vers Supabase**
   - Google redirige vers le callback Supabase : `https://vbqvhumwsbezoipaexsw.supabase.co/auth/v1/callback`
   - Supabase échange le code d'autorisation contre une session

4. **Redirection vers l'application**
   - Supabase redirige vers `/auth/callback` avec la session
   - La page `/auth/callback` :
     - Récupère la session Supabase
     - Récupère ou crée le profil utilisateur
     - Met à jour le store d'authentification
     - Redirige vers le dashboard

## 🔍 Dépannage

### L'utilisateur n'est pas redirigé après connexion

- Vérifiez que l'URL de callback est bien configurée dans Supabase
- Vérifiez que l'URL dans `redirectTo` correspond à votre domaine

### Erreur "Invalid redirect URL"

- Vérifiez que `https://cardz.dev/auth/callback` est dans les **Redirect URLs** de Supabase
- Vérifiez que l'URL dans le code correspond exactement (pas de slash final, etc.)

### Le profil n'est pas créé

- Vérifiez que le trigger de création de profil existe dans Supabase
- La page `/auth/callback` crée automatiquement un profil si nécessaire

## 📝 Notes importantes

- Le client Supabase pour OAuth (`supabaseClient.ts`) est différent du client SSR (`client.ts`)
- Le client OAuth est utilisé uniquement pour l'authentification côté client
- Le client SSR est utilisé pour les opérations serveur et les requêtes API

## 🔐 Sécurité

- Les variables `NEXT_PUBLIC_*` sont exposées côté client (c'est normal pour Supabase)
- La clé `ANON_KEY` est publique mais limitée par les RLS (Row Level Security) de Supabase
- Ne jamais exposer la clé `SERVICE_ROLE_KEY` côté client

