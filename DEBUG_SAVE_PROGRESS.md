# 💾 Debug - Progression Non Sauvegardée

## 🚨 Symptôme

Vous étiez à 20% de progression, vous avez quitté, et quand vous revenez, la progression est revenue à 0% (ou à un état antérieur).

## 🔍 Diagnostic Immédiat

### Étape 1 : Vérifier que la Migration SQL a été Exécutée

**La cause #1 est souvent que la colonne `session_state` n'existe pas en base de données.**

#### Dans Supabase Dashboard :

1. Allez dans **SQL Editor**
2. Exécutez cette requête :

```sql
-- Vérifier si les colonnes existent
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'study_sessions' 
AND column_name IN ('session_state', 'card_order', 'shuffle', 'start_from');
```

**Résultat attendu** :
```
column_name    | data_type
---------------|-----------
session_state  | jsonb
card_order     | jsonb
shuffle        | boolean
start_from     | integer
```

**Si les colonnes n'apparaissent PAS**, exécutez la migration :

```sql
-- Migration complète
ALTER TABLE public.study_sessions
  ADD COLUMN IF NOT EXISTS shuffle BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS start_from INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS card_order JSONB,
  ADD COLUMN IF NOT EXISTS session_state JSONB;

COMMENT ON COLUMN public.study_sessions.shuffle IS 'Whether cards are shuffled in this session';
COMMENT ON COLUMN public.study_sessions.start_from IS 'Starting card index (1-based) - allows starting from a specific card';
COMMENT ON COLUMN public.study_sessions.card_order IS 'Array of flashcard IDs in the order they appear in this session (preserves shuffle or subset)';
COMMENT ON COLUMN public.study_sessions.session_state IS 'Full session state including progress, mastered cards, incorrect cards queue, etc. for resuming';

CREATE INDEX IF NOT EXISTS idx_study_sessions_completed ON public.study_sessions(user_id, completed, started_at DESC);
```

### Étape 2 : Tester la Sauvegarde en Temps Réel

1. **Ouvrez la console** (F12)
2. **Lancez une session d'étude**
3. **Répondez à 2-3 cartes**
4. **Regardez les logs**

#### ✅ Logs Attendus (Sauvegarde OK) :

```javascript
[Study] Final state: { currentIndex: 1, nextCardId: 'card-xyz' }

[StudyService] Updating session state for: abc123
[StudyService] State to save: {
  currentIndex: 1,
  cards: 45,
  masteredCards: 0,
  incorrectCards: 1
}
[StudyService] Update response status: 200
[StudyService] ✅ Session state updated successfully

[Study] Progress auto-saved after answer
```

#### ❌ Logs d'Erreur :

**Erreur : Colonne Manquante**
```javascript
[API] Error updating session state: { ... }
[API] ⚠️ Column session_state does not exist! Run migration: supabase/add_session_parameters.sql
```
→ **Solution** : Exécutez la migration SQL ci-dessus

**Erreur : Unauthorized**
```javascript
[StudyService] No auth session for updateSessionState
```
→ **Solution** : Reconnectez-vous

**Erreur : 500**
```javascript
[StudyService] Update response status: 500
[StudyService] Update error: { ... }
```
→ **Solution** : Vérifiez les logs de l'API dans Supabase Dashboard

### Étape 3 : Vérifier la Sauvegarde en Base de Données

Après avoir répondu à quelques cartes :

```sql
-- Vérifier le contenu de session_state
SELECT 
  id,
  mode,
  created_at,
  session_state->>'currentIndex' as current_index,
  jsonb_array_length(session_state->'cards') as total_cards,
  jsonb_array_length(session_state->'masteredCards') as mastered_count
FROM study_sessions
WHERE user_id = 'VOTRE-USER-ID'
  AND completed = false
ORDER BY created_at DESC
LIMIT 5;
```

**Résultat attendu** :
```
id       | mode      | current_index | total_cards | mastered_count
---------|-----------|---------------|-------------|-----------------
abc123   | flashcard | 3             | 45          | 1
```

Si `session_state` est **NULL** ou **vide** → La sauvegarde ne fonctionne pas

## 🛠️ Solutions

### Solution A : Exécuter la Migration (PRIORITAIRE)

```bash
# Méthode 1 : Via Supabase Dashboard
1. Dashboard > SQL Editor
2. Ouvrir: supabase/add_session_parameters.sql
3. Copier-coller le contenu
4. Exécuter (Run)

# Méthode 2 : Via CLI Supabase
supabase db reset
# ou
supabase db push
```

### Solution B : Forcer la Sauvegarde Manuelle

Si la sauvegarde automatique échoue, testez manuellement :

```javascript
// Dans la console pendant une session d'étude :
(async () => {
  const { data: { session } } = await supabaseBrowser.auth.getSession();
  
  if (!session) {
    console.log('❌ Not authenticated');
    return;
  }
  
  // Trouver le session ID
  const sessionId = 'VOTRE-SESSION-ID'; // Depuis l'URL ou les logs
  
  const testState = {
    currentIndex: 99,
    cards: [],
    masteredCards: [],
    incorrectCards: [],
  };
  
  const response = await fetch(`/api/study/sessions/${sessionId}/state`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    credentials: 'include',
    body: JSON.stringify({ sessionState: testState }),
  });
  
  const result = await response.json();
  console.log('Save test result:', response.status, result);
  
  if (response.ok) {
    console.log('✅ Sauvegarde fonctionne !');
  } else {
    console.log('❌ Erreur:', result.error);
  }
})();
```

### Solution C : Vérifier la Restauration

Après avoir quitté et repris :

```javascript
// Dans la console après avoir cliqué "Reprendre" :
console.log('Session state restored:', sessionState);
console.log('Current index:', sessionState?.currentIndex);
console.log('Mastered cards:', sessionState?.masteredCards?.size || 0);
```

Si `sessionState` est vide ou a `currentIndex: 0` → La restauration échoue

## 📊 Script de Diagnostic Complet

Copiez-collez ce script dans la console pendant une session :

```javascript
(async () => {
  console.log('=== DIAGNOSTIC SAUVEGARDE ===\n');
  
  // 1. Vérifier l'authentification
  const { data: { session } } = await supabaseBrowser.auth.getSession();
  console.log('1️⃣ Auth:', session ? '✅ OK' : '❌ No session');
  
  if (!session) return;
  
  // 2. Trouver le sessionId
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('resume') || 
                    document.querySelector('[data-session-id]')?.dataset?.sessionId ||
                    'unknown';
  
  console.log('2️⃣ Session ID:', sessionId);
  
  if (sessionId === 'unknown') {
    console.log('⚠️ Cannot find session ID. Start a study session first.');
    return;
  }
  
  // 3. Tester la sauvegarde
  console.log('\n3️⃣ Testing save...');
  
  const testState = {
    currentIndex: Date.now() % 100, // Random number
    cards: [],
    masteredCards: [],
    incorrectCards: [],
  };
  
  try {
    const saveRes = await fetch(`/api/study/sessions/${sessionId}/state`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      credentials: 'include',
      body: JSON.stringify({ sessionState: testState }),
    });
    
    const saveData = await saveRes.json();
    
    if (saveRes.ok) {
      console.log('✅ Save: OK');
      console.log('   Saved currentIndex:', testState.currentIndex);
    } else {
      console.log('❌ Save: FAILED');
      console.log('   Status:', saveRes.status);
      console.log('   Error:', saveData.error);
      
      if (saveData.details?.includes('session_state')) {
        console.log('\n🚨 MIGRATION REQUIRED!');
        console.log('   Run: supabase/add_session_parameters.sql');
      }
    }
  } catch (err) {
    console.log('❌ Save: EXCEPTION');
    console.log('   Error:', err.message);
  }
  
  // 4. Vérifier la lecture
  console.log('\n4️⃣ Testing read...');
  
  try {
    const readRes = await fetch(`/api/study/sessions/${sessionId}`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
      credentials: 'include',
    });
    
    const readData = await readRes.json();
    
    if (readRes.ok) {
      console.log('✅ Read: OK');
      console.log('   session_state exists:', !!readData.session_state);
      console.log('   currentIndex:', readData.session_state?.currentIndex);
      
      if (readData.session_state?.currentIndex === testState.currentIndex) {
        console.log('   ✅ Value matches! Save/Load works correctly.');
      } else {
        console.log('   ⚠️ Value mismatch. Expected:', testState.currentIndex, 'Got:', readData.session_state?.currentIndex);
      }
    } else {
      console.log('❌ Read: FAILED');
      console.log('   Error:', readData.error);
    }
  } catch (err) {
    console.log('❌ Read: EXCEPTION');
    console.log('   Error:', err.message);
  }
  
  console.log('\n=== END DIAGNOSTIC ===');
})();
```

## 🎯 Checklist

- [ ] Migration SQL exécutée (`session_state` column exists)
- [ ] Console ouverte pendant l'étude
- [ ] Logs `[StudyService] ✅ Session state updated successfully` apparaissent
- [ ] Logs `[Study] Progress auto-saved after answer` apparaissent
- [ ] `session_state` visible en DB après quelques réponses
- [ ] Progression restaurée correctement après "Reprendre"

## 🚀 Test Rapide

1. **Exécutez la migration SQL** (voir ci-dessus)
2. **Rafraîchissez la page** (Ctrl+R)
3. **Lancez une session** avec la console ouverte (F12)
4. **Répondez à 3 cartes**
5. **Vérifiez les logs** : doit montrer `✅ Session state updated successfully`
6. **Quittez** (fermez l'onglet)
7. **Revenez** sur /dashboard
8. **Cliquez "Reprendre"**
9. **Vérifiez** : vous devriez être exactement où vous étiez

Si ça ne fonctionne toujours pas après la migration, **partagez-moi les logs de la console** ! 📊

---

**Note** : 99% des problèmes viennent de la migration non exécutée. Commencez par là !
