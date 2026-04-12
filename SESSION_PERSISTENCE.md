# Session Persistence Implementation

## Vue d'ensemble

Cette implémentation ajoute un système complet de persistance de session pour l'application d'étude. Les sessions sont maintenant configurables et peuvent être reprises plus tard.

## Fonctionnalités

### 1. **Paramètres de Session Persistés**

Chaque session d'étude stocke maintenant :
- **shuffle**: Si les cartes sont mélangées
- **start_from**: Index de la carte de départ (1-based)
- **card_order**: Ordre exact des cartes dans la session (IDs)
- **session_state**: État complet de la session (progression, cartes maîtrisées, etc.)

### 2. **Comportement des Paramètres**

#### Ordre des Cartes (Shuffle)
- **Non mélangé**: Les cartes apparaissent dans l'ordre original
- **Mélangé**: Les cartes sélectionnées sont mélangées aléatoirement
- ✅ Le mélange s'applique uniquement aux cartes du sous-ensemble sélectionné

#### Carte de Départ (Start From)
- Permet de commencer à une carte spécifique (ex: carte 10)
- **Les cartes avant l'index choisi N'APPARAISSENT JAMAIS dans la session**
- Exemple: Start from 10 sur 52 cartes = 43 cartes dans la session (10 à 52)
- ✅ Le compteur affiche toujours la position réelle (ex: "Card 10 of 52")

### 3. **Cohérence Entre Modes**

Tous les modes (Flashcard, Quiz, Writing, Match) :
- ✅ Utilisent exactement les MÊMES cartes du sous-ensemble
- ✅ Respectent l'ordre défini (original ou mélangé)
- ✅ Partagent les mêmes paramètres de session
- ✅ Créent des sous-sessions liées à la configuration initiale

### 4. **Reprise de Session**

#### Écran des Paramètres
- Affiche automatiquement les sessions en cours pour ce set
- Permet de choisir entre :
  - **Reprendre une session existante** : Restaure l'ordre des cartes et la progression
  - **Créer une nouvelle session** : Configure de nouveaux paramètres

#### Sauvegarde Automatique
- L'état de la session est sauvegardé **toutes les 10 secondes**
- Permet de quitter et revenir sans perdre sa progression
- Restaure : les cartes vues, les cartes maîtrisées, les cartes à revoir

## Architecture Technique

### Base de Données

#### Nouvelles Colonnes (study_sessions)
```sql
ALTER TABLE public.study_sessions
  ADD COLUMN shuffle BOOLEAN DEFAULT FALSE,
  ADD COLUMN start_from INTEGER DEFAULT 1,
  ADD COLUMN card_order JSONB,
  ADD COLUMN session_state JSONB;
```

Fichier de migration : `supabase/add_session_parameters.sql`

### API Endpoints

#### POST /api/study/sessions
Accepte maintenant :
```typescript
{
  setId: string;
  mode: string;
  shuffle?: boolean;
  startFrom?: number;
  cardOrder?: string[];
  sessionState?: any;
}
```

#### GET /api/study/sessions/active?setId={id}
Retourne toutes les sessions actives (non complétées) de l'utilisateur pour un set donné.

#### PATCH /api/study/sessions/[id]/state
Met à jour l'état d'une session (sauvegarde automatique).

### Frontend

#### Services (lib/supabase/study.ts)
- `startSession()` : Crée une session avec paramètres
- `getActiveSessions()` : Récupère les sessions en cours
- `updateSessionState()` : Sauvegarde l'état
- `getSession()` : Récupère une session complète

#### Composants

##### StudySettings
- Affiche les sessions actives
- Permet de reprendre ou créer une nouvelle session
- UI claire montrant les paramètres de chaque session

##### Study Page
- `handleStartStudy()` : Crée une session avec paramètres
- `handleResumeSession()` : Restaure une session existante
- Auto-save toutes les 10 secondes
- Partage les paramètres entre tous les modes

## Flux Utilisateur

### Création de Session
1. L'utilisateur ouvre la page d'étude
2. L'écran des paramètres affiche :
   - Les sessions en cours (si existantes)
   - Les options de configuration
3. L'utilisateur choisit :
   - **Reprendre** : Click sur une session → Restauration immédiate
   - **Nouvelle** : Configure paramètres → Clique "Lancer"
4. La session démarre avec les paramètres choisis/restaurés

### Pendant la Session
- L'utilisateur peut changer de mode librement
- Chaque mode utilise les MÊMES cartes
- L'état est sauvegardé automatiquement
- Le compteur affiche toujours la position réelle

### Reprise Plus Tard
- L'utilisateur peut fermer l'onglet/navigateur
- Au retour : les sessions incomplètes sont affichées
- Click pour reprendre → Restauration exacte de l'état

## Avantages

✅ **Cohérence** : Tous les modes respectent les mêmes paramètres
✅ **Persistance** : Ne perdez jamais votre progression
✅ **Flexibilité** : Reprenez où vous vous êtes arrêté
✅ **Clarté** : UI explicite sur ce qui sera étudié
✅ **Fiabilité** : Sauvegarde automatique toutes les 10 secondes

## Migration

Pour activer cette fonctionnalité sur une instance existante :

1. **Exécuter la migration SQL** :
```bash
psql -h YOUR_HOST -d YOUR_DB -U YOUR_USER -f supabase/add_session_parameters.sql
```

2. **Redéployer l'application** avec le nouveau code

3. Les anciennes sessions continueront de fonctionner (valeurs par défaut appliquées)

## Notes Importantes

- Les sessions complétées ne peuvent pas être reprises
- Les paramètres d'une session sont immuables une fois créée
- Changer de mode crée une sous-session avec les MÊMES paramètres
- Le compteur de cartes montre toujours la position dans le set complet (pas le sous-ensemble)
