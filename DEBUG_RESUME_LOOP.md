# 🔄 Debug - Boucle de Chargement Infinie lors de la Reprise

## 🚨 Symptôme

Quand vous cliquez sur "Reprendre", vous voyez :
```
Reprise de la session en cours...
Chargement de votre progression
```

Et ça charge **indéfiniment** sans jamais lancer le jeu.

## 🔍 Diagnostic Immédiat

### Étape 1 : Ouvrir la Console (F12)

**IMPORTANT** : La console contient tous les logs qui expliquent le problème.

1. Appuyez sur **F12** (ou Cmd+Option+I sur Mac)
2. Allez dans l'onglet **Console**
3. Cliquez sur "Reprendre" à nouveau
4. Regardez les messages qui s'affichent

### Étape 2 : Lire les Logs

Vous devriez voir des messages commençant par `[Study]` :

#### ✅ Logs Normaux (Succès) :
```javascript
[Study] Auto-resuming session: abc123
[Study] Session data received: { ... }
[Study] Using card_order from session: 45 cards
[Study] Cards prepared: 45
[Study] Restoring session state with 45 cards
[Study] Next card: card-xyz
[Study] ✅ Auto-resume successful: abc123
```

#### ❌ Logs d'Erreur (Problème) :
```javascript
[Study] ❌ Failed to auto-resume session: Error: ...
```

## 🐛 Erreurs Courantes et Solutions

### Erreur 1 : "Waiting for flashcards to load..."

**Log** :
```javascript
[Study] Waiting for flashcards to load...
[Study] Waiting for flashcards to load...
[Study] Waiting for flashcards to load...
...
```

**Cause** : Les flashcards du set ne se chargent pas

**Solution** :
```javascript
// Dans la console, vérifiez :
console.log('Flashcards:', originalFlashcards);
// Si vide ou undefined → Le set n'a pas de cartes ou ne se charge pas

// Testez manuellement :
const { data, error } = await supabase
  .from('sets')
  .select('*, flashcards(*)')
  .eq('id', 'VOTRE-SET-ID')
  .single();

console.log('Set:', data);
console.log('Flashcards:', data?.flashcards);
```

### Erreur 2 : "Unauthorized"

**Log** :
```javascript
[Study] ❌ Failed to auto-resume session: Error: Unauthorized
```

**Cause** : Session expirée ou problème d'authentification

**Solution** :
1. Déconnectez-vous
2. Reconnectez-vous
3. Réessayez

### Erreur 3 : "Session introuvable"

**Log** :
```javascript
[Study] ❌ Failed to auto-resume session: Error: Session introuvable en base de données
```

**Cause** : La session a été supprimée ou n'existe pas

**Solution** :
```sql
-- Vérifiez dans Supabase Dashboard :
SELECT * FROM study_sessions 
WHERE id = 'VOTRE-SESSION-ID';

-- Si vide → Créez une nouvelle session
```

### Erreur 4 : "Aucune carte trouvée"

**Log** :
```javascript
[Study] Cards prepared: 0
[Study] ❌ Failed to auto-resume session: Error: Aucune carte trouvée pour cette session
```

**Cause** : 
- `card_order` contient des IDs qui n'existent plus
- Les cartes du set ont été supprimées

**Solution** :
1. Terminez cette session (Dashboard → "Terminer")
2. Créez une nouvelle session

### Erreur 5 : Pas d'Erreur Visible

**Log** :
```javascript
[Study] Auto-resuming session: abc123
[Study] Session data received: { ... }
... puis plus rien
```

**Cause** : Une erreur silencieuse s'est produite

**Solution** :
```javascript
// Dans la console, activez tous les logs :
localStorage.setItem('debug', 'true');
window.location.reload();

// Puis réessayez
```

## 🛠️ Corrections Apportées

### 1. **Timeout de Sécurité** ⏱️
- Si après 10 secondes ça ne charge toujours pas, un message d'erreur s'affiche
- Évite les boucles infinies

### 2. **Reset Automatique** 🔄
- En cas d'erreur, `shouldAutoResume` est TOUJOURS remis à `false`
- Empêche les boucles infinies

### 3. **Logs Détaillés** 📊
- Tous les logs sont préfixés `[Study]`
- Emojis pour identifier succès ✅ ou erreur ❌
- Stack trace en cas d'erreur

### 4. **Meilleure Gestion d'Erreurs** 🛡️
- Messages d'erreur explicites
- Propositions de solutions
- Retour au modal de settings en cas d'échec

## 🧪 Test de Diagnostic

Copiez-collez ce script dans la console pour voir l'état exact :

```javascript
(async () => {
  console.log('=== DIAGNOSTIC REPRISE SESSION ===');
  
  // 1. État actuel
  console.log('shouldAutoResume:', shouldAutoResume);
  console.log('resumeSessionId:', resumeSessionId);
  console.log('originalFlashcards:', originalFlashcards?.length || 0, 'cartes');
  console.log('hasStarted:', hasStarted);
  
  // 2. Tester la récupération de session
  if (resumeSessionId) {
    try {
      const session = await fetch(`/api/study/sessions/${resumeSessionId}`, {
        credentials: 'include'
      }).then(r => r.json());
      
      console.log('Session API response:', session);
      console.log('card_order:', session.card_order?.length || 0, 'cartes');
      console.log('session_state:', session.session_state ? 'Présent' : 'Absent');
    } catch (error) {
      console.error('Erreur API:', error);
    }
  }
  
  console.log('=== FIN DIAGNOSTIC ===');
})();
```

## 🚀 Solutions Rapides

### Solution A : Terminer et Recréer

```bash
1. Dashboard → Section "Sessions en cours"
2. Click "Terminer" sur la session problématique
3. Retournez sur /study/[set-id]
4. Configurez les paramètres
5. Click "Lancer"
6. Testez immédiatement la reprise (sans fermer)
```

### Solution B : Forcer la Reconnexion

```bash
1. Déconnexion
2. Fermez TOUS les onglets
3. Rouvrez et reconnectez-vous
4. Réessayez
```

### Solution C : Vider l'URL

```bash
1. Si l'URL contient ?resume=...
2. Enlevez le ?resume=... manuellement
3. Appuyez sur Entrée
4. Vous devriez voir le modal de settings
```

## 📊 Checklist de Debug

- [ ] Console ouverte (F12)
- [ ] Logs `[Study]` visibles
- [ ] Identifié l'erreur exacte
- [ ] Session existe en DB
- [ ] Flashcards se chargent
- [ ] Utilisateur connecté
- [ ] Timeout < 10 secondes
- [ ] Migration SQL exécutée

## 💡 Si Rien Ne Fonctionne

1. **Supprimez TOUTES les sessions** (Dashboard → "Supprimer tout")
2. **Vérifiez la migration SQL** : `supabase/add_session_parameters.sql`
3. **Créez une nouvelle session de test**
4. **Partagez les logs de la console** (screenshot ou copie texte)

---

**Note** : Avec les corrections apportées, le chargement infini ne devrait plus se produire. Un timeout de 10 secondes max est maintenant en place.
