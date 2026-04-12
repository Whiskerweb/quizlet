# 🔐 Debug - Erreur "Unauthorized" lors de la Reprise

## 🚨 Symptôme

Quand vous cliquez sur "Reprendre", vous voyez :
```
Impossible de reprendre la session.
Raison: Unauthorized
```

## 🔍 Causes Possibles

### 1. **Session Expirée** ⏰
Votre session d'authentification Supabase a expiré.

**Comment vérifier** :
```javascript
// Dans la console (F12) :
const { data } = await supabaseBrowser.auth.getSession();
console.log('Session:', data.session);
// Si null → Session expirée
```

**Solution** :
1. Déconnectez-vous
2. Reconnectez-vous
3. Réessayez immédiatement

### 2. **Token Invalide** 🎫
Le token d'authentification n'est plus valide ou a été révoqué.

**Solution** :
```javascript
// Dans la console :
await supabaseBrowser.auth.refreshSession();
// Puis réessayez
```

### 3. **Session Supprimée** 🗑️
La session d'étude a été supprimée de la base de données.

**Comment vérifier** :
```sql
-- Dans Supabase Dashboard > SQL Editor :
SELECT * FROM study_sessions 
WHERE id = 'VOTRE-SESSION-ID' 
AND user_id = 'VOTRE-USER-ID';
```

**Solution** :
- Terminez la session fantôme depuis le dashboard
- Créez une nouvelle session

### 4. **RLS (Row Level Security) Bloqué** 🛡️
Les politiques RLS de Supabase empêchent l'accès.

**Comment vérifier** :
```sql
-- Dans Supabase Dashboard :
SELECT * FROM study_sessions 
WHERE id = 'SESSION-ID';

-- Si vous voyez la session mais l'app ne peut pas la lire
-- → Problème RLS
```

**Solution** : Vérifiez les politiques RLS dans Supabase Dashboard

### 5. **Cookie Bloqué** 🍪
Les cookies d'authentification sont bloqués ou manquants.

**Solution** :
1. Vérifiez que les cookies ne sont pas bloqués dans votre navigateur
2. Essayez en navigation privée (pour tester)
3. Videz le cache et les cookies
4. Reconnectez-vous

## 🔧 Solutions Rapides

### Solution A : Rafraîchir la Session

```javascript
// Dans la console (F12) :
(async () => {
  console.log('=== REFRESH SESSION ===');
  
  // 1. Vérifier la session actuelle
  const { data: currentSession } = await supabaseBrowser.auth.getSession();
  console.log('Current session:', currentSession.session ? 'EXISTS' : 'NULL');
  
  if (!currentSession.session) {
    console.log('❌ No session, need to login');
    return;
  }
  
  // 2. Rafraîchir
  const { data: refreshed, error } = await supabaseBrowser.auth.refreshSession();
  
  if (error) {
    console.error('❌ Refresh failed:', error);
  } else {
    console.log('✅ Session refreshed!');
    console.log('New token:', refreshed.session?.access_token.substring(0, 20) + '...');
  }
})();
```

### Solution B : Vérifier Qui Est Connecté

```javascript
// Dans la console :
(async () => {
  const { data: { user } } = await supabaseBrowser.auth.getUser();
  console.log('User:', user);
  console.log('User ID:', user?.id);
  console.log('Email:', user?.email);
  
  // Vérifier si le user_id de la session correspond
  const sessionId = 'VOTRE-SESSION-ID'; // Remplacez
  const response = await fetch(`/api/study/sessions/${sessionId}`, {
    credentials: 'include'
  });
  
  const session = await response.json();
  console.log('Session user_id:', session.user_id);
  console.log('Match:', session.user_id === user?.id ? '✅' : '❌');
})();
```

### Solution C : Test Complet

```javascript
// Script de diagnostic complet :
(async () => {
  console.log('=== DIAGNOSTIC UNAUTHORIZED ===');
  
  // 1. Vérifier l'authentification
  console.log('\n1️⃣ AUTHENTICATION CHECK');
  const { data: { session }, error: authError } = await supabaseBrowser.auth.getSession();
  
  if (!session) {
    console.error('❌ No session found');
    if (authError) console.error('Auth error:', authError);
    console.log('\n👉 Solution: Reconnectez-vous');
    return;
  }
  
  console.log('✅ Session found');
  console.log('User:', session.user.email);
  console.log('Token:', session.access_token.substring(0, 20) + '...');
  console.log('Expires:', new Date(session.expires_at * 1000));
  
  // 2. Vérifier si le token est expiré
  console.log('\n2️⃣ TOKEN EXPIRY CHECK');
  const now = Date.now() / 1000;
  const expiresAt = session.expires_at;
  const timeLeft = expiresAt - now;
  
  if (timeLeft < 0) {
    console.error('❌ Token expired', Math.abs(timeLeft), 'seconds ago');
    console.log('\n👉 Solution: Rafraîchir la session ou se reconnecter');
  } else {
    console.log('✅ Token valid for', Math.floor(timeLeft / 60), 'minutes');
  }
  
  // 3. Tester l'API
  console.log('\n3️⃣ API TEST');
  const sessionId = new URLSearchParams(window.location.search).get('resume');
  
  if (!sessionId) {
    console.log('⚠️ No session ID in URL');
    console.log('Current URL:', window.location.href);
    return;
  }
  
  console.log('Testing session:', sessionId);
  
  try {
    const response = await fetch(`/api/study/sessions/${sessionId}`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
      credentials: 'include',
    });
    
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Session retrieved!');
      console.log('Set:', data.sets?.title);
      console.log('Mode:', data.mode);
      console.log('User ID:', data.user_id);
      console.log('Match:', data.user_id === session.user.id ? '✅' : '❌');
    } else {
      const error = await response.json();
      console.error('❌ API Error:', error);
      console.log('\n👉 Details:', error);
    }
  } catch (err) {
    console.error('❌ Network error:', err);
  }
  
  console.log('\n=== END DIAGNOSTIC ===');
})();
```

## 🛠️ Corrections Apportées

### 1. **Logs Détaillés** 📊
Le service `studyService.getSession` affiche maintenant :
```
[StudyService] Getting session: abc123
[StudyService] Auth session: Found
[StudyService] Fetching session with token...
[StudyService] Response status: 200
[StudyService] Session retrieved successfully
```

### 2. **Messages d'Erreur Explicites** 💬
- Si **401/403** → "Session expirée ou non autorisée. Veuillez vous reconnecter."
- Si **pas de session auth** → "Non authentifié. Veuillez vous reconnecter."
- Sinon → Message d'erreur spécifique de l'API

### 3. **Authentification Robuste** 🔐
L'API `/api/study/sessions/[id]` vérifie :
1. Cookies d'abord
2. Header `Authorization` en fallback
3. Vérifie que `user_id` de la session = `user.id` actuel

## 📋 Checklist de Debug

- [ ] Console ouverte (F12)
- [ ] Logs `[StudyService]` visibles
- [ ] Session auth existe (`await supabaseBrowser.auth.getSession()`)
- [ ] Token non expiré
- [ ] User connecté (`supabaseBrowser.auth.getUser()`)
- [ ] Session d'étude existe en DB
- [ ] `user_id` de la session = `user.id` actuel
- [ ] RLS autorise l'accès

## 🚀 Actions Immédiates

### Si "Session expirée" :
1. **Déconnexion** → Click sur le bouton de déconnexion
2. **Reconnexion** → Entrez vos identifiants
3. **Réessayer** → Cliquez sur "Reprendre"

### Si "Non authentifié" :
```javascript
// Dans la console :
window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
```

### Si Rien Ne Marche :
1. **Ouvrez la console (F12)**
2. **Copiez-collez le "Script de diagnostic complet" ci-dessus**
3. **Appuyez sur Entrée**
4. **Partagez-moi les résultats** (screenshot ou copie texte)

---

**Note** : Avec les logs ajoutés, vous verrez exactement où le problème se produit. La plupart du temps, c'est une session expirée qui nécessite une simple reconnexion.
