# 🐛 Debug - Sets Non Visibles

## 🚨 Symptômes

- Vous ne voyez plus vos sets créés
- Les sets partagés n'apparaissent plus
- Impossible de créer un nouveau set

## 🔍 Diagnostic Rapide

### Étape 1 : Vérifier l'Authentification

Ouvrez la console du navigateur (F12) et tapez :

```javascript
// Vérifier la session
const { data } = await supabase.auth.getSession();
console.log('Session:', data.session);
console.log('User:', data.session?.user);

// Si null ou undefined → Vous n'êtes PAS connecté
// Solution : Reconnectez-vous
```

### Étape 2 : Vérifier les Erreurs Console

Dans la console, cherchez des erreurs rouges :
- `Not authenticated`
- `Unauthorized`
- `Session expired`
- `Invalid token`

### Étape 3 : Tester une Requête Manuelle

```javascript
// Test de récupération des sets
const { data, error } = await supabase
  .from('sets')
  .select('*')
  .limit(5);

console.log('Sets:', data);
console.log('Error:', error);

// Si error → Il y a un problème avec la requête ou les permissions
```

## 🛠️ Solutions Possibles

### Solution 1 : Reconnexion Simple

```bash
1. Déconnectez-vous de l'application
2. Fermez tous les onglets
3. Rouvrez l'application
4. Reconnectez-vous
5. Vérifiez si vos sets apparaissent
```

### Solution 2 : Vider le Cache/Cookies

```bash
1. F12 → Application tab (Chrome) / Storage tab (Firefox)
2. Cliquez sur "Clear site data" / "Clear storage"
3. Fermez et rouvrez le navigateur
4. Reconnectez-vous
```

### Solution 3 : Vérifier les RLS (Row Level Security)

```sql
-- Dans Supabase Dashboard → SQL Editor
-- Vérifier que vos politiques RLS sont actives

SELECT tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'sets';

-- Doit retourner des politiques comme :
-- sets_select_own_or_public
-- sets_insert_authenticated
-- etc.
```

### Solution 4 : Recréer l'Utilisateur Profile

```sql
-- Vérifier que votre profil existe
SELECT id, username, email
FROM profiles
WHERE id = 'VOTRE-USER-ID';

-- Si null, créez le profil manuellement :
INSERT INTO profiles (id, username, email)
VALUES (
  'VOTRE-USER-ID',
  'votre-username',
  'votre-email@example.com'
);
```

## 🔧 Vérifications Techniques

### Vérifier supabaseBrowserClient

```javascript
// Console du navigateur
import { supabaseBrowser } from './lib/supabaseBrowserClient';

// Tester le client
const { data: session } = await supabaseBrowser.auth.getSession();
console.log('Browser client session:', session);
```

### Vérifier AuthStore

```javascript
// Console
const authStore = useAuthStore.getState();
console.log('Auth store:', {
  user: authStore.user,
  profile: authStore.profile,
  isLoading: authStore.isLoading
});
```

## 📊 Erreurs Communes

### Erreur 1 : "Not authenticated"

**Cause** : Session expirée ou perdue

**Solution** :
```javascript
// Forcer la reconnexion
await supabase.auth.signOut();
// Puis reconnectez-vous via l'interface
```

### Erreur 2 : "Session expired"

**Cause** : Token expiré

**Solution** :
```javascript
// Rafraîchir la session
const { data, error } = await supabase.auth.refreshSession();
console.log('Session refreshed:', data);
```

### Erreur 3 : Sets retourne []

**Cause** : RLS bloque l'accès ou user_id incorrect

**Solutions** :
1. Vérifier les politiques RLS (voir Solution 3)
2. Vérifier que vous êtes bien le propriétaire :
```sql
SELECT id, title, user_id 
FROM sets 
WHERE user_id = 'VOTRE-USER-ID';
```

## 🚀 Script de Diagnostic Complet

Copiez-collez dans la console du navigateur :

```javascript
// Script de diagnostic complet
(async () => {
  console.log('=== DIAGNOSTIC SETS ===');
  
  // 1. Vérifier la session
  const { data: sessionData } = await supabase.auth.getSession();
  console.log('✓ Session:', {
    user_id: sessionData.session?.user?.id,
    email: sessionData.session?.user?.email,
    expires_at: sessionData.session?.expires_at
  });
  
  if (!sessionData.session?.user) {
    console.error('❌ PAS DE SESSION - Vous devez vous reconnecter !');
    return;
  }
  
  // 2. Vérifier le profil
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', sessionData.session.user.id)
    .single();
  
  console.log('✓ Profile:', profile);
  if (profileError) console.error('❌ Profile error:', profileError);
  
  // 3. Vérifier les sets
  const { data: sets, error: setsError } = await supabase
    .from('sets')
    .select('id, title, user_id, created_at')
    .eq('user_id', sessionData.session.user.id);
  
  console.log('✓ Vos sets:', sets);
  console.log('   Nombre de sets:', sets?.length || 0);
  if (setsError) console.error('❌ Sets error:', setsError);
  
  // 4. Vérifier les politiques RLS
  const { data: policies } = await supabase.rpc('exec', {
    query: `SELECT policyname FROM pg_policies WHERE tablename = 'sets'`
  }).then(() => ({ data: 'RLS policies exist' }))
    .catch(() => ({ data: 'Cannot check RLS (normal)' }));
  
  console.log('✓ RLS status:', policies);
  
  // 5. Résumé
  console.log('\n=== RÉSUMÉ ===');
  if (!sessionData.session?.user) {
    console.log('❌ PROBLÈME: Pas de session → RECONNECTEZ-VOUS');
  } else if (!profile) {
    console.log('❌ PROBLÈME: Pas de profil → Créez le profil');
  } else if (setsError) {
    console.log('❌ PROBLÈME: Erreur RLS ou DB →', setsError.message);
  } else if (!sets || sets.length === 0) {
    console.log('⚠️ AUCUN SET TROUVÉ (mais pas d\'erreur)');
    console.log('   - Soit vous n\'avez pas de sets');
    console.log('   - Soit user_id ne correspond pas');
  } else {
    console.log('✅ TOUT SEMBLE OK - Vous avez', sets.length, 'set(s)');
  }
})();
```

## 🎯 Actions Immédiates

1. **Copiez le script ci-dessus**
2. **Collez-le dans la console (F12)**
3. **Lisez le résumé à la fin**
4. **Suivez les instructions**

## 📞 Si Rien Ne Fonctionne

Fournissez ces informations :

```
1. Résultat du script de diagnostic (copiez tout)
2. Erreurs dans la console (screenshot)
3. Onglet Network → Filtrer par "sets" → Montrer les requêtes échouées
4. Avez-vous exécuté des migrations SQL récemment ? (Oui/Non)
```

---

**Note** : Le problème le plus probable est une session expirée. Essayez d'abord de vous reconnecter !
