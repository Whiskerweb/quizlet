# 🐛 Debug - Reprise de Session

## Problème Rencontré

**Symptôme** : Message "Impossible de reprendre la session. Elle a peut-être été supprimée."

**Quand** : En cliquant sur "Reprendre" dans le modal des paramètres d'étude

## 🔍 Étapes de Debug

### 1. Ouvrir la Console du Navigateur (F12)

Avant de cliquer sur "Reprendre", ouvrez la console pour voir les logs.

### 2. Chercher les Logs

Après avoir cliqué sur "Reprendre", vous devriez voir :

```javascript
[Study] Attempting to resume session: <session-id>
[Study] Session data received: { ... }
```

### 3. Vérifier les Données de la Session

#### Cas 1 : Session Trouvée ✅
```javascript
[Study] Session data received: {
  id: "abc123",
  mode: "flashcard",
  card_order: ["card1", "card2", ...],
  session_state: { ... },
  start_from: 8,
  shuffle: false
}
```

#### Cas 2 : Session Non Trouvée ❌
```javascript
[Study] Session data received: null
// ou
Error: Session not found
```

#### Cas 3 : Données Manquantes ⚠️
```javascript
[Study] Session data received: {
  id: "abc123",
  mode: "flashcard",
  card_order: null,  // ← Problème
  session_state: null
}
```

## 🔧 Solutions par Cas

### Cas A : Session Non Trouvée

**Causes possibles** :
1. Session supprimée de la DB
2. Migration SQL non exécutée
3. Mauvais ID de session

**Vérifications** :
```sql
-- Dans Supabase Dashboard → SQL Editor
SELECT * FROM study_sessions 
WHERE id = 'session-id-ici'
AND completed = false;
```

**Solutions** :
- Si aucune ligne → Session supprimée, créez-en une nouvelle
- Si `completed = true` → Session terminée, créez-en une nouvelle
- Si existe → Vérifiez les colonnes `card_order`, `session_state`

### Cas B : Colonnes Manquantes (card_order = NULL)

**Cause** : Migration SQL non exécutée

**Solution** :
```bash
1. Exécutez supabase/add_session_parameters.sql
2. Vérifiez que les colonnes existent :
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'study_sessions';
   # Doit contenir : card_order, session_state, shuffle, start_from
```

### Cas C : Erreur API

**Symptôme** : Erreur 404, 401, ou 500

**Vérifications** :
1. Onglet "Network" dans la console
2. Cherchez la requête `/api/study/sessions/[id]`
3. Regardez la réponse

**Solutions** :
- **404** : Session n'existe pas → Créez une nouvelle session
- **401** : Non authentifié → Reconnectez-vous
- **500** : Erreur serveur → Vérifiez les logs Supabase

## 🧪 Test Manuel

### Test 1 : Vérifier qu'une Session Existe

```javascript
// Dans la console du navigateur
const sessionId = 'VOTRE-SESSION-ID';
const response = await fetch(`/api/study/sessions/${sessionId}`, {
  credentials: 'include'
});
const data = await response.json();
console.log('Session data:', data);
```

### Test 2 : Créer et Reprendre une Session

```bash
1. Allez sur /study/[set-id]
2. Configurez : "Ordre original" + "Commencer à la carte 8"
3. Cliquez "Lancer"
4. Console : "[Study] Session created successfully: <id>"
5. Notez l'ID de la session
6. Répondez à 2-3 cartes
7. Fermez l'onglet
8. Rouvrez /dashboard
9. Vérifiez que la session apparaît
10. Cliquez "Reprendre"
11. Console : Regardez les logs
```

## 📊 Logs Attendus (Succès)

```javascript
[Study] Attempting to resume session: abc123
[Study] Session data received: { id: "abc123", ... }
[Study] Using card_order from session: 45 cards
[Study] Ordered cards prepared: 45
[Study] Restoring session state with 45 cards
[Study] Next card from restored state: card-xyz
[Study] Session resumed successfully: abc123
```

## 🚨 Logs d'Erreur Communs

### Erreur 1 : No card_order
```javascript
[Study] Session data received: { id: "abc123", card_order: null }
[Study] No card_order, using all flashcards
[Study] Ordered cards prepared: 52  // ← Utilise TOUTES les cartes
```

**Solution** : Migration SQL manquante → Exécutez `add_session_parameters.sql`

### Erreur 2 : No cards found
```javascript
[Study] Ordered cards prepared: 0
Error: No cards found for this session
```

**Causes** :
- Les IDs dans `card_order` ne correspondent à aucune carte
- Les flashcards du set ont été supprimées

**Solution** : Terminez la session et créez-en une nouvelle

### Erreur 3 : Session not found
```javascript
Error: Session not found
```

**Solution** : La session n'existe pas en DB → Créez-en une nouvelle

## 🛠️ Actions Correctives

### Action 1 : Nettoyer les Sessions Corrompues

```sql
-- Dans Supabase Dashboard
-- Supprimez les sessions sans card_order
DELETE FROM study_sessions 
WHERE card_order IS NULL 
AND completed = false
AND created_at < NOW() - INTERVAL '1 day';
```

### Action 2 : Forcer la Création d'une Nouvelle Session

```javascript
// Dans la console du navigateur
localStorage.removeItem('currentSessionId');
window.location.reload();
```

### Action 3 : Vérifier l'Authentification

```javascript
// Dans la console
const { data } = await supabase.auth.getSession();
console.log('User:', data.session?.user);
// Si null → Reconnectez-vous
```

## 📝 Checklist de Debug

- [ ] Console ouverte (F12)
- [ ] Logs visibles après click "Reprendre"
- [ ] Vérifier : `[Study] Session data received`
- [ ] Vérifier : `card_order` n'est pas `null`
- [ ] Vérifier : `card_order` contient des IDs
- [ ] Vérifier : Les IDs correspondent à des cartes du set
- [ ] Vérifier : Pas d'erreur 404/401/500 dans "Network"
- [ ] Vérifier : Migration SQL exécutée

## 🎯 Solution Rapide

Si tout échoue :

```bash
1. Terminez toutes les sessions en cours (bouton "Supprimer tout")
2. Vérifiez que la migration SQL est exécutée
3. Créez une nouvelle session
4. Testez la reprise immédiatement (sans fermer le navigateur)
5. Si ça marche → Fermez et testez la reprise après réouverture
```

## 📞 Informations à Fournir si le Problème Persiste

Copiez-collez dans un fichier texte :

```
1. Logs de la console (tout le bloc [Study])
2. Réponse de l'API (/api/study/sessions/[id])
3. Résultat de cette requête SQL :
   SELECT id, mode, card_order, session_state, start_from, shuffle, completed
   FROM study_sessions 
   WHERE id = 'VOTRE-SESSION-ID';
4. Version de Next.js (package.json)
5. Avez-vous exécuté la migration SQL ? (Oui/Non)
```

---

**Note** : Avec les logs améliorés, vous devriez maintenant voir exactement où ça échoue dans la console !
