# Configuration Supabase pour OAuth Google

## ✅ Checklist de configuration

### 1. Configuration dans Supabase Dashboard

#### A. Activer le provider Google
1. Allez dans votre projet Supabase Dashboard
2. Naviguez vers **Authentication** > **Providers**
3. Trouvez **Google** dans la liste
4. Activez le toggle **Enable Google provider**
5. Configurez :
   - **Client ID (for OAuth)** : Votre Client ID Google
   - **Client Secret (for OAuth)** : Votre Client Secret Google
6. Cliquez sur **Save**

#### B. Configurer les URLs de redirection
1. Toujours dans **Authentication** > **URL Configuration**
2. Dans la section **Redirect URLs**, ajoutez :
   ```
   https://cardz.dev/auth/callback
   http://localhost:3000/auth/callback (pour le développement local)
   ```
3. Dans **Site URL**, mettez :
   ```
   https://cardz.dev
   ```
4. Cliquez sur **Save**

### 2. Configuration Google Cloud Console

#### A. Créer les credentials OAuth
1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Sélectionnez votre projet (ou créez-en un)
3. Allez dans **APIs & Services** > **Credentials**
4. Cliquez sur **+ CREATE CREDENTIALS** > **OAuth client ID**
5. Si c'est la première fois, configurez l'écran de consentement OAuth :
   - **User Type** : External
   - Remplissez les informations requises
   - Ajoutez votre email comme test user
6. Créez l'OAuth client :
   - **Application type** : Web application
   - **Name** : CARDZ (ou le nom de votre choix)
   - **Authorized redirect URIs** : 
     ```
     https://vbqvhumwsbezoipaexsw.supabase.co/auth/v1/callback
     ```
     ⚠️ **IMPORTANT** : C'est l'URL de callback de Supabase, pas celle de votre app !
7. Copiez le **Client ID** et **Client Secret**
8. Collez-les dans Supabase Dashboard (étape 1.A)

### 3. Vérification

#### Vérifier que tout est configuré :
- ✅ Google provider activé dans Supabase
- ✅ Client ID et Client Secret configurés dans Supabase
- ✅ Redirect URL `https://cardz.dev/auth/callback` ajoutée dans Supabase
- ✅ Site URL `https://cardz.dev` configurée dans Supabase
- ✅ OAuth client créé dans Google Cloud Console
- ✅ Redirect URI `https://vbqvhumwsbezoipaexsw.supabase.co/auth/v1/callback` ajoutée dans Google Cloud Console

### 4. Test

1. Allez sur votre site : `https://cardz.dev/login`
2. Cliquez sur "Continuer avec Google"
3. Vous devriez être redirigé vers Google pour vous connecter
4. Après connexion, vous devriez être redirigé vers `/auth/callback`
5. Puis automatiquement vers `/dashboard`

## 🔍 Dépannage

### Erreur "Timeout : la session n'a pas pu être récupérée"
- Vérifiez que l'URL de callback est bien dans les Redirect URLs de Supabase
- Vérifiez que l'URL dans Google Cloud Console correspond exactement à celle de Supabase
- Vérifiez les logs de la console du navigateur pour voir les erreurs

### Erreur "Auth session missing!"
- Vérifiez que le hash fragment (`#access_token=...`) est présent dans l'URL
- Vérifiez que les variables d'environnement `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` sont correctes

### Erreur "redirect_uri_mismatch"
- Vérifiez que l'URL dans Google Cloud Console est exactement : `https://vbqvhumwsbezoipaexsw.supabase.co/auth/v1/callback`
- Pas de slash final, pas d'erreur de typo

### L'utilisateur n'est pas redirigé
- Vérifiez que `https://cardz.dev/auth/callback` est dans les Redirect URLs de Supabase
- Vérifiez que le Site URL est bien `https://cardz.dev`

## 📝 Notes importantes

- L'URL de callback dans **Google Cloud Console** doit être celle de **Supabase**, pas celle de votre app
- L'URL de callback dans **Supabase Dashboard** doit être celle de **votre app** (`https://cardz.dev/auth/callback`)
- Le hash fragment (`#access_token=...`) est automatiquement traité par le client Supabase
- Si le hash fragment n'est pas traité automatiquement, le code essaie de l'extraire manuellement

