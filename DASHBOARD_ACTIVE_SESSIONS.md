# Dashboard - Sessions Actives

## Vue d'Ensemble

Une nouvelle section a été ajoutée au dashboard pour afficher toutes les sessions d'étude en cours de l'utilisateur, avec la possibilité de les reprendre ou de les terminer.

## Emplacement

La section "Sessions en cours" apparaît dans le dashboard principal (`/dashboard`) entre les insights statistiques et la liste des dossiers/sets.

## Fonctionnalités

### 1. **Affichage des Sessions Actives**

Chaque session affichée montre :
- 🎯 **Mode** : Flashcard, Quiz, Writing, ou Match (avec badge coloré)
- 📚 **Titre du set** : Nom du set étudié
- ⏰ **Temps écoulé** : "Il y a X min/h/j"
- 🔢 **Nombre de cartes** : Total de cartes dans la session
- 🔀 **Mélangé** : Indication si les cartes sont mélangées (icône shuffle)
- ▶️ **Carte de départ** : Si la session démarre à partir d'une carte spécifique (ex: "Carte 10+")
- 📊 **Barre de progression** : Visualisation des cartes maîtrisées (si disponible)

### 2. **Actions Disponibles**

#### Bouton "Reprendre"
- Redirige vers la page d'étude avec la session restaurée
- Restaure :
  - L'ordre exact des cartes (avec shuffle ou non)
  - Le mode d'étude choisi
  - La progression (cartes maîtrisées, incorrectes, etc.)
  - La position dans la session

#### Bouton "Terminer"
- Permet de terminer manuellement une session
- Demande confirmation avant suppression
- Marque la session comme `completed = true`
- La session n'apparaît plus dans la liste

### 3. **Comportement Intelligent**

#### Affichage Conditionnel
- Si aucune session active → La section ne s'affiche pas
- Si sessions en cours → Affichage automatique avec nombre de sessions

#### Auto-Reprise
- Cliquer sur "Reprendre" redirige vers `/study/[setId]?resume=[sessionId]`
- La page d'étude détecte le paramètre `resume` et restaure automatiquement la session
- Si erreur (session supprimée) → Affiche les paramètres normalement

## Composants Créés

### `ActiveSessions.tsx`

**Emplacement** : `/apps/web/components/ActiveSessions.tsx`

**Responsabilités** :
- Charger les sessions actives via `studyService.getActiveSessions()`
- Afficher la liste avec toutes les informations
- Gérer la reprise de session (redirection)
- Gérer la fermeture de session (appel API + confirmation)

**Props** : Aucune (component autonome)

**État interne** :
- `sessions` : Liste des sessions actives
- `isLoading` : État de chargement
- `deletingSessionId` : ID de la session en cours de suppression

## Intégration

### Dans le Dashboard

```tsx
// apps/web/app/(dashboard)/dashboard/page.tsx

import { ActiveSessions } from '@/components/ActiveSessions';

// Dans le render, après les insights :
<div className="mb-8">
  <ActiveSessions />
</div>
```

### Dans la Page d'Étude

La logique de reprise automatique a été ajoutée :

```tsx
// Détection du paramètre URL 'resume'
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const resumeId = urlParams.get('resume');
  if (resumeId) {
    setResumeSessionId(resumeId);
    setShouldAutoResume(true);
  }
}, [setId]);

// Auto-reprise quand les données sont prêtes
useEffect(() => {
  if (shouldAutoResume && resumeSessionId && originalFlashcards.length > 0) {
    handleResumeSession(resumeSessionId);
  }
}, [shouldAutoResume, resumeSessionId, originalFlashcards]);
```

## API Utilisées

### `GET /api/study/sessions/active`
- Récupère toutes les sessions actives de l'utilisateur
- Filtre : `completed = false`
- Trie : Par date de création (plus récentes en premier)
- Retourne : Sessions avec relations (sets, etc.)

### `PATCH /api/study/sessions/[id]/complete`
- Marque une session comme terminée
- Met à jour : `completed = true`, `completed_at = NOW()`

### `GET /api/study/sessions/[id]`
- Récupère une session spécifique pour reprise
- Inclut : `card_order`, `session_state`, relations

## Design

### Couleurs par Mode

```tsx
const modeColors = {
  flashcard: 'bg-blue-500',   // Bleu
  quiz: 'bg-purple-500',      // Violet
  writing: 'bg-green-500',    // Vert
  match: 'bg-orange-500',     // Orange
};
```

### Indicateurs Visuels

- 🔵 **Badge du mode** : Coloré selon le mode d'étude
- 🔀 **Icône Shuffle** : Bleu si mélangé
- ▶️ **Icône Play** : Orange si carte de départ spécifique
- 📊 **Barre de progression** : Verte pour les cartes maîtrisées

## Flux Utilisateur

### Scénario 1 : Reprendre une Session

```
1. User ouvre /dashboard
   ↓
2. Voit "Sessions en cours" avec 2 sessions
   ↓
3. Clique sur "Reprendre" pour "Vocabulaire Espagnol"
   ↓
4. Redirigé vers /study/abc123?resume=xyz789
   ↓
5. Page d'étude détecte le paramètre 'resume'
   ↓
6. Appelle studyService.getSession(xyz789)
   ↓
7. Restaure l'ordre des cartes, le mode, la progression
   ↓
8. User reprend exactement où il s'était arrêté
```

### Scénario 2 : Terminer une Session

```
1. User ouvre /dashboard
   ↓
2. Voit une session "Mathématiques" qu'il ne veut plus continuer
   ↓
3. Clique sur "Terminer"
   ↓
4. Popup de confirmation : "Voulez-vous vraiment terminer ?"
   ↓
5. User confirme
   ↓
6. Appelle studyService.completeSession(sessionId)
   ↓
7. Session marquée comme completed = true
   ↓
8. Liste rechargée → Session disparaît
```

## Cas Limites Gérés

### Session Supprimée
- Si user clique sur "Reprendre" mais la session a été supprimée
- → Affiche une alerte
- → Redirige vers l'écran des paramètres

### Aucune Session Active
- Si `sessions.length === 0`
- → Le composant retourne `null`
- → Rien ne s'affiche (pas de section vide)

### Session Sans card_order
- Si session créée avant migration
- → `card_order = null`
- → Utilise toutes les cartes du set (comportement par défaut)

### Progression Indisponible
- Si `session_state = null`
- → Barre de progression non affichée
- → Seules les métadonnées basiques sont montrées

## Performance

### Optimisations
- Chargement lazy du composant (pas de SSR)
- Affichage conditionnel (masqué si vide)
- État de chargement avec skeleton UI
- Désactivation du bouton pendant la suppression

### Requêtes
- 1 seule requête au montage : `getActiveSessions()`
- Rechargement après suppression : automatique
- Pas de polling (pas de refresh auto)

## Améliorations Futures

### V1.1 - Statistiques
- Afficher le % de progression dans chaque session
- Temps total passé dans la session
- Nombre de cartes vues vs restantes

### V1.2 - Actions Avancées
- Bouton "Reprendre avec un autre mode"
- Exporter la progression
- Partager une session

### V1.3 - Notifications
- Rappel si session inactive depuis X jours
- Badge "nouvelle session" pendant 24h
- Notification avant expiration (si implémenté)

## Tests Recommandés

### Tests Manuels

1. ✅ Créer une session, quitter, revenir → La session apparaît
2. ✅ Cliquer "Reprendre" → Restauration correcte
3. ✅ Cliquer "Terminer" → Session disparaît
4. ✅ Avoir 0 session → Rien ne s'affiche
5. ✅ Session avec shuffle → Icône shuffle visible
6. ✅ Session avec start_from → Indication visible
7. ✅ Session avec progression → Barre de progression affichée
8. ✅ Changer de mode pendant session → Nouvelle session liée

### Tests d'Erreurs

1. ✅ Session supprimée entre temps → Alerte + fallback
2. ✅ API down → Affiche 0 sessions (pas de crash)
3. ✅ Migration non appliquée → Fonctionne en mode dégradé

## Compatibilité

### Avec Migration SQL
✅ Toutes les fonctionnalités activées
- Persistance complète
- Reprise de session
- Historique des sessions

### Sans Migration SQL
⚠️ Mode dégradé mais fonctionnel
- Sessions visibles seulement si créées dans la session actuelle
- Pas de persistance entre rechargements
- API renvoie `[]` pour `getActiveSessions()`

## Conclusion

Cette fonctionnalité améliore considérablement l'UX en permettant :
- ✅ Visibilité sur toutes les sessions en cours
- ✅ Reprise facile sans perdre sa progression
- ✅ Nettoyage manuel des sessions abandonnées
- ✅ Vue centralisée dans le dashboard
