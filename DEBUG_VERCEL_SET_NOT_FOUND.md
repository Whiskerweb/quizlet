# 🔍 Guide de Débogage : "Set non trouvé" sur Vercel

## Problème
Le set n'est pas trouvé en production sur Vercel, même si le lien de partage fonctionne en local.

## Étapes de Diagnostic

### 1. Vérifier les Logs Vercel (API Route)

1. Allez sur **https://vercel.com**
2. Ouvrez votre projet
3. Cliquez sur **"Deployments"**
4. Ouvrez le dernier déploiement
5. Cliquez sur **"Functions"**
6. Trouvez `/api/sets/share/[shareId]`
7. Cliquez dessus pour voir les logs

**Cherchez ces logs :**
- `[API] Getting set with shareId: ...`
- `[API] Creating Supabase client...`
- `[API] Querying sets table...`
- `[API] Error fetching set:` (si erreur)
- `[API] Set found:` (si succès)

### 2. Vérifier les Variables d'Environnement

Dans Vercel :
1. **Settings** → **Environment Variables**
2. Vérifiez que ces variables sont définies :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Vérifiez qu'elles sont activées pour **Production**

### 3. Vérifier les Logs du Navigateur

1. Ouvrez la console du navigateur (F12)
2. Allez sur la page du set partagé
3. Cherchez les logs commençant par `[Client]`

**Logs attendus :**
- `[Client] Fetching set from API: ...`
- `[Client] API response status: ...`
- `[Client] Set loaded from API:` (si succès)
- `[Client] Error fetching set by shareId via API:` (si erreur)

### 4. Vérifier dans Supabase

1. Allez sur **https://supabase.com**
2. Ouvrez votre projet
3. **SQL Editor** → Créez une nouvelle requête :

```sql
-- Vérifier si le set existe
SELECT id, title, share_id, is_public, password_hash
FROM sets
WHERE share_id = 'VOTRE_SHARE_ID_ICI';
```

**Remplacez `VOTRE_SHARE_ID_ICI` par le shareId du lien qui ne fonctionne pas.**

### 5. Vérifier les Politiques RLS

Dans Supabase :
1. **Authentication** → **Policies**
2. Vérifiez la table `sets`
3. Assurez-vous qu'il y a une politique :
   ```sql
   "Public sets are viewable by everyone"
   USING (is_public = true)
   ```

### 6. Tester l'API Route Directement

Dans votre navigateur ou avec curl :

```bash
curl https://votre-app.vercel.app/api/sets/share/VOTRE_SHARE_ID
```

**Remplacez :**
- `votre-app.vercel.app` par votre URL Vercel
- `VOTRE_SHARE_ID` par le shareId

Vous devriez voir une réponse JSON avec les données du set ou une erreur.

## Solutions Possibles

### Solution 1 : Variables d'environnement manquantes
- Ajoutez les variables dans Vercel
- Redéployez

### Solution 2 : Set n'est pas public
- Vérifiez dans Supabase que `is_public = true`
- Vérifiez que `share_id` est correct

### Solution 3 : Problème RLS
- Vérifiez les politiques RLS dans Supabase
- Assurez-vous que les sets publics sont accessibles

### Solution 4 : Problème de cache
- Videz le cache du navigateur
- Essayez en navigation privée

## Informations à Partager pour le Débogage

Si le problème persiste, partagez :

1. **Logs Vercel** (de l'API route)
2. **Logs navigateur** (console)
3. **Résultat de la requête SQL** dans Supabase
4. **Réponse de l'API** (curl ou navigateur)
5. **ShareId** qui ne fonctionne pas (sans le mot de passe si protégé)







