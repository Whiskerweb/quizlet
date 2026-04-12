# 📋 Audit Complet : Système de Sessions en Cours

## 🎯 Vue d'Ensemble

Ce document audite le système de gestion des sessions d'étude en cours, leur affichage, leur sauvegarde, et leur reprise. Ce système doit être répliqué pour les classes (`my-class`).

---

## 📊 Architecture Actuelle

### 1. **Composants Principaux**

#### A. `ActiveSessions.tsx` (Dashboard)
**Emplacement** : `apps/web/components/ActiveSessions.tsx`

**Responsabilités** :
- ✅ Afficher toutes les sessions actives de l'utilisateur
- ✅ Charger via `studyService.getActiveSessions()`
- ✅ Afficher progression `X/Y` (cartes maîtrisées / total)
- ✅ Bouton "Reprendre" → Navigation vers `/study/[setId]?resume=[sessionId]`
- ✅ Bouton "Terminer" → Marque la session comme `completed = true`
- ✅ Gestion d'erreurs si migration SQL non exécutée

**État interne** :
```typescript
const [sessions, setSessions] = useState<ActiveSession[]>([]);
const [isLoading, setIsLoading] = useState(true);
const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
```

**Interface ActiveSession** :
```typescript
interface ActiveSession {
  id: string;
  mode: string;                    // 'flashcard', 'quiz', 'writing', 'match'
  started_at: string;              // ISO timestamp
  shuffle?: boolean;                // Si les cartes sont mélangées
  start_from?: number;              // Carte de départ (1-based)
  total_cards: number;              // Nombre total de cartes
  session_state?: {                 // État complet de la session
    currentIndex: number;
    cards: CardReview[];
    masteredCards: Set<string> | string[];  // IDs des cartes maîtrisées
    incorrectCards: string[];       // Queue des cartes à revoir
  };
  sets?: {
    id: string;
    title: string;
  };
}
```

**Fonctions clés** :
- `loadActiveSessions()` : Appelle `studyService.getActiveSessions()`
- `handleResumeSession(session)` : Navigation vers `/study/${session.sets?.id}?resume=${session.id}`
- `handleCompleteSession(sessionId)` : Marque comme terminée via `studyService.completeSession()`
- `getMasteredCount(masteredCards)` : Gère Set et Array pour compter les cartes maîtrisées
- `getTimeAgo(dateString)` : Format "Il y a X min/h/j"

**UI** :
- Card bleue (`border-blue-500/30 bg-blue-50/30`)
- Badge de mode coloré (bleu/purple/green/orange)
- Détails : temps écoulé, nombre de cartes, shuffle, start_from
- Barre de progression verte (`X/Y`)
- Boutons "Reprendre" et "Terminer"

---

#### B. `study.ts` (Service)
**Emplacement** : `apps/web/lib/supabase/study.ts`

**Fonction `getActiveSessions(setId?: string)`** :
```typescript
async getActiveSessions(setId?: string) {
  const { data: { session } } = await supabaseBrowser.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const url = setId 
    ? `/api/study/sessions/active?setId=${setId}`
    : '/api/study/sessions/active';

  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${session.access_token}` },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to get active sessions' }));
    throw new Error(error.error || 'Failed to get active sessions');
  }

  return response.json();
}
```

**Autres fonctions utilisées** :
- `getSession(sessionId)` : Récupère une session complète (pour reprise)
- `completeSession(sessionId)` : Marque une session comme terminée
- `updateSessionState(sessionId, sessionState)` : Sauvegarde l'état (auto-save)

---

#### C. API Route `/api/study/sessions/active`
**Emplacement** : `apps/web/app/api/study/sessions/active/route.ts`

**Logique** :
1. Vérifie l'authentification
2. Requête Supabase :
   ```typescript
   const query = supabase
     .from('study_sessions')
     .select(`
       id,
       mode,
       started_at,
       shuffle,
       start_from,
       total_cards,
       session_state,
       card_order,
       sets:set_id (
         id,
         title
       )
     `)
     .eq('user_id', userId)
     .eq('completed', false)
     .order('started_at', { ascending: false });
   
   if (setId) {
     query = query.eq('set_id', setId);
   }
   ```
3. Retourne les sessions avec relations

---

#### D. Page d'Étude (`/study/[id]/page.tsx`)
**Emplacement** : `apps/web/app/(dashboard)/study/[id]/page.tsx`

**Auto-reprise via URL** :
```typescript
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const resumeId = urlParams.get('resume');
  if (resumeId && originalFlashcards.length > 0 && !hasStarted) {
    setResumeSessionId(resumeId);
    setShouldAutoResume(true);
  }
}, [setId, originalFlashcards.length, hasStarted]);
```

**Fonction `handleResumeSession(sessionId)`** :
1. Appelle `studyService.getSession(sessionId)`
2. Restaure l'ordre des cartes via `session.card_order`
3. Restaure l'état via `session.session_state` :
   - `currentIndex`
   - `cards` (avec `isMastered`, `correctCount`, `incorrectCount`)
   - `masteredCards` (Set)
   - `incorrectCards` (Array)
4. Trouve la carte suivante via `getNextCard(restoredState)`
5. Met à jour `modeMemory` pour persister en mémoire
6. Lance la session

**Sauvegarde automatique** :
```typescript
// Après chaque réponse
if (sessionId && sessionId.startsWith('local-') === false) {
  await studyService.updateSessionState(sessionId, nextState);
}

// Auto-save périodique (toutes les 30s)
useEffect(() => {
  const interval = setInterval(() => {
    if (sessionId && sessionState && !sessionId.startsWith('local-')) {
      studyService.updateSessionState(sessionId, sessionState);
    }
  }, 30000);
  return () => clearInterval(interval);
}, [sessionId, sessionState]);
```

---

### 2. **Base de Données**

#### Table `study_sessions`
**Colonnes utilisées** :
```sql
id UUID PRIMARY KEY
user_id UUID (FK -> auth.users)
set_id UUID (FK -> sets)
mode TEXT ('flashcard', 'quiz', 'writing', 'match')
total_cards INTEGER
completed BOOLEAN DEFAULT false
started_at TIMESTAMPTZ
completed_at TIMESTAMPTZ

-- Colonnes ajoutées pour persistance :
shuffle BOOLEAN DEFAULT false           -- Si les cartes sont mélangées
start_from INTEGER DEFAULT 1            -- Carte de départ (1-based)
card_order JSONB                         -- Array de flashcard IDs dans l'ordre
session_state JSONB                      -- État complet de la session
```

**Index** :
```sql
CREATE INDEX idx_study_sessions_completed 
  ON public.study_sessions(user_id, completed, started_at DESC);
```

**RLS Policy** :
```sql
-- Users can view their own sessions
CREATE POLICY "Users can view own sessions"
  ON public.study_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own sessions
CREATE POLICY "Users can update own sessions"
  ON public.study_sessions FOR UPDATE
  USING (auth.uid() = user_id);
```

---

### 3. **Calcul de la Progression**

**Affichage "X/Y"** :
```typescript
// Dans ActiveSessions.tsx
const getMasteredCount = (masteredCards: any) => {
  if (!masteredCards) return 0;
  if (Array.isArray(masteredCards)) return masteredCards.length;
  if (typeof masteredCards === 'object' && masteredCards.size !== undefined) 
    return masteredCards.size;
  return 0;
};

// Dans le render
{session.session_state?.masteredCards && (
  <div className="flex items-center gap-2">
    <div className="flex-1 h-1.5 bg-bg-subtle rounded-full overflow-hidden">
      <div
        className="h-full bg-green-500 transition-all"
        style={{
          width: `${(getMasteredCount(session.session_state.masteredCards) / session.total_cards) * 100}%`,
        }}
      />
    </div>
    <span className="text-[11px] text-content-muted">
      {getMasteredCount(session.session_state.masteredCards)}/{session.total_cards}
    </span>
  </div>
)}
```

**Logique de maîtrise** :
- Une carte est maîtrisée si :
  - Elle a été répondue correctement **au moins 2 fois** dans n'importe quelle session
  - OU elle a `card_progress.repetitions >= 2`
- Le comptage se fait dans `get_set_progress` (RPC SQL) ou dans `session_state.masteredCards`

---

### 4. **Flux Complet**

#### Création de Session
```
1. Utilisateur ouvre /study/[setId]
2. Configure paramètres (mode, shuffle, start_from)
3. Clique "Lancer"
4. handleStartStudy() :
   - Crée session via studyService.startSession()
   - Sauvegarde : shuffle, start_from, card_order, session_state initial
   - Démarre l'étude
5. Après chaque réponse :
   - Met à jour sessionState localement
   - Sauvegarde via updateSessionState() (immédiat + périodique)
```

#### Affichage des Sessions Actives
```
1. ActiveSessions.tsx se monte
2. loadActiveSessions() appelle studyService.getActiveSessions()
3. API route récupère depuis Supabase :
   SELECT * FROM study_sessions 
   WHERE user_id = ? AND completed = false
   ORDER BY started_at DESC
4. Affiche chaque session avec :
   - Mode, titre du set, temps écoulé
   - Nombre de cartes, shuffle, start_from
   - Progression X/Y avec barre verte
   - Boutons "Reprendre" et "Terminer"
```

#### Reprise de Session
```
1. Utilisateur clique "Reprendre"
2. handleResumeSession(session) :
   router.push(`/study/${session.sets?.id}?resume=${session.id}`)
3. Page d'étude détecte ?resume= dans l'URL
4. Auto-reprise :
   - Appelle studyService.getSession(sessionId)
   - Restaure card_order → orderedCards
   - Restaure session_state → restoredState
   - Trouve nextCard via getNextCard(restoredState)
   - Met à jour modeMemory
   - Lance la session exactement où elle était
```

#### Terminaison de Session
```
1. Utilisateur clique "Terminer"
2. Confirmation
3. handleCompleteSession(sessionId) :
   await studyService.completeSession(sessionId)
4. API met à jour :
   UPDATE study_sessions 
   SET completed = true, completed_at = NOW()
   WHERE id = ?
5. Rechargement de la liste
```

---

## 🔧 Points Techniques Importants

### 1. **Sérialisation Set ↔ Array**
```typescript
// Lors de la sauvegarde
const serializedState = {
  ...sessionState,
  masteredCards: sessionState.masteredCards instanceof Set 
    ? Array.from(sessionState.masteredCards) 
    : sessionState.masteredCards,
};

// Lors de la restauration
masteredCards: new Set(
  Array.isArray(session.session_state.masteredCards) 
    ? session.session_state.masteredCards 
    : []
),
```

### 2. **Gestion des Sessions Locales**
Les sessions avec ID `local-*` ne sont pas sauvegardées en DB :
```typescript
if (sessionId && sessionId.startsWith('local-') === false) {
  await studyService.updateSessionState(sessionId, nextState);
}
```

### 3. **Mode Memory**
```typescript
type ModeMemory = {
  sessionState: StudySessionState;
  currentCard: CardReview | null;
  isFlipped: boolean;
  sessionId: string;
  flashcards: Flashcard[];
  matchCompleted: boolean;
};

type ModeMemoryMap = Record<StudyMode, ModeMemory>;
```
Permet de passer d'un mode à l'autre sans perdre l'état.

---

## 📝 Implémentation pour My-Class

### Étapes à Répliquer

#### 1. **Adapter `loadActiveSessions` dans `/my-class/[id]/page.tsx`**

**Actuel** (lignes 309-363) :
- ✅ Récupère les sessions pour les sets des modules de la classe
- ❌ N'affiche PAS la progression `X/Y`
- ❌ N'affiche PAS `session_state`
- ❌ Ne filtre PAS par mode correctement

**À faire** :
```typescript
const loadActiveSessions = async (modulesList?: ClassModule[]) => {
  if (!user?.id) return;
  
  const currentModules = modulesList || modules;
  if (currentModules.length === 0) return;

  try {
    const moduleIds = currentModules.map((m: ClassModule) => (m as any).module_id);

    const { data: setsData, error: setsError } = await supabaseBrowser
      .from('sets')
      .select('id')
      .in('folder_id', moduleIds);

    if (setsError) throw setsError;

    const setIds = (setsData || []).map((s: any) => s.id);
    if (setIds.length === 0) return;

    // ✅ UTILISER studyService.getActiveSessions() au lieu de requête directe
    const sessions = await studyService.getActiveSessions();
    
    // Filtrer pour ne garder que les sessions des sets de cette classe
    const classSessions = sessions.filter((s: any) => 
      setIds.includes(s.set_id)
    );

    // ✅ INCLURE session_state dans l'affichage
    setActiveSessions(classSessions);
  } catch (error) {
    console.error('Failed to load active sessions:', error);
  }
};
```

#### 2. **Créer un Composant `ClassActiveSessions.tsx`**

Basé sur `ActiveSessions.tsx`, mais :
- ✅ Filtré par classe (sets dans les modules de la classe)
- ✅ Même UI (progression X/Y, boutons)
- ✅ Navigation vers `/study/[setId]?resume=[sessionId]` fonctionne déjà

**Code à ajouter** :
```typescript
// apps/web/components/ClassActiveSessions.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { studyService } from '@/lib/supabase/study';
import { Play, X, Clock, Shuffle, Hash } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabaseBrowserClient';

interface ClassActiveSession {
  id: string;
  mode: string;
  started_at: string;
  shuffle?: boolean;
  start_from?: number;
  total_cards: number;
  session_state?: {
    masteredCards: Set<string> | string[];
  };
  set_id: string;
  sets?: {
    id: string;
    title: string;
  };
}

interface ClassActiveSessionsProps {
  classId: string;
  moduleIds: string[]; // IDs des modules de la classe
}

export function ClassActiveSessions({ classId, moduleIds }: ClassActiveSessionsProps) {
  const router = useRouter();
  const [sessions, setSessions] = useState<ClassActiveSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadActiveSessions();
  }, [classId, moduleIds]);

  const loadActiveSessions = async () => {
    try {
      setIsLoading(true);
      
      // Récupérer les sets des modules
      const { data: setsData, error: setsError } = await supabaseBrowser
        .from('sets')
        .select('id')
        .in('folder_id', moduleIds);

      if (setsError) throw setsError;

      const setIds = (setsData || []).map((s: any) => s.id);
      if (setIds.length === 0) {
        setSessions([]);
        return;
      }

      // Récupérer toutes les sessions actives
      const allSessions = await studyService.getActiveSessions();
      
      // Filtrer pour cette classe
      const classSessions = allSessions.filter((s: any) => 
        setIds.includes(s.set_id)
      );

      setSessions(classSessions);
    } catch (error) {
      console.error('[ClassActiveSessions] Failed to load:', error);
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResumeSession = (session: ClassActiveSession) => {
    router.push(`/study/${session.set_id}?resume=${session.id}`);
  };

  const handleCompleteSession = async (sessionId: string) => {
    if (!confirm('Voulez-vous vraiment terminer cette session ?')) return;

    try {
      await studyService.completeSession(sessionId);
      await loadActiveSessions();
    } catch (error) {
      console.error('[ClassActiveSessions] Failed to complete:', error);
      alert('Impossible de terminer la session.');
    }
  };

  const getMasteredCount = (masteredCards: any) => {
    if (!masteredCards) return 0;
    if (Array.isArray(masteredCards)) return masteredCards.length;
    if (typeof masteredCards === 'object' && masteredCards.size !== undefined) 
      return masteredCards.size;
    return 0;
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    return `Il y a ${diffDays}j`;
  };

  const getModeLabel = (mode: string) => {
    const labels: Record<string, string> = {
      flashcard: 'Flashcards',
      quiz: 'Quiz',
      writing: 'Écriture',
      match: 'Association',
    };
    return labels[mode] || mode;
  };

  if (isLoading) {
    return (
      <Card className="p-6 animate-pulse">
        <div className="h-6 bg-bg-subtle rounded w-1/3 mb-4"></div>
      </Card>
    );
  }

  if (sessions.length === 0) {
    return null;
  }

  return (
    <Card className="p-6 border-blue-500/30 bg-blue-50/30">
      <h3 className="text-[18px] font-semibold text-content-emphasis mb-4">
        Sessions en cours
      </h3>
      <p className="text-[13px] text-content-muted mb-4">
        {sessions.length} session{sessions.length > 1 ? 's' : ''} non terminée{sessions.length > 1 ? 's' : ''}
      </p>

      <div className="space-y-3">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="rounded-xl border border-border-subtle bg-bg-emphasis p-4 transition-all hover:shadow-card"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white bg-purple-500">
                    {getModeLabel(session.mode)}
                  </span>
                  <h4 className="text-[15px] font-semibold text-content-emphasis">
                    {session.sets?.title || 'Set inconnu'}
                  </h4>
                </div>

                <div className="flex items-center gap-4 text-[12px] text-content-muted flex-wrap">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{getTimeAgo(session.started_at)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Hash className="h-3.5 w-3.5" />
                    <span>{session.total_cards} cartes</span>
                  </div>
                  {session.shuffle && (
                    <div className="flex items-center gap-1 text-blue-600">
                      <Shuffle className="h-3.5 w-3.5" />
                      <span>Mélangé</span>
                    </div>
                  )}
                  {session.start_from && session.start_from > 1 && (
                    <div className="flex items-center gap-1 text-orange-600">
                      <Play className="h-3.5 w-3.5" />
                      <span>Carte {session.start_from}+</span>
                    </div>
                  )}
                </div>

                {/* ✅ PROGRESSION X/Y */}
                {session.session_state?.masteredCards && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-bg-subtle rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 transition-all"
                        style={{
                          width: `${(getMasteredCount(session.session_state.masteredCards) / session.total_cards) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-[11px] text-content-muted">
                      {getMasteredCount(session.session_state.masteredCards)}/{session.total_cards}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleResumeSession(session)}
                  className="flex items-center gap-1.5"
                >
                  <Play className="h-3.5 w-3.5" />
                  Reprendre
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCompleteSession(session.id)}
                  className="flex items-center gap-1.5 hover:text-state-danger hover:border-state-danger"
                >
                  <X className="h-3.5 w-3.5" />
                  Terminer
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
```

#### 3. **Intégrer dans `/my-class/[id]/page.tsx`**

```typescript
import { ClassActiveSessions } from '@/components/ClassActiveSessions';

// Dans le render
{modules.length > 0 && (
  <ClassActiveSessions 
    classId={classId}
    moduleIds={modules.map(m => m.module_id)}
  />
)}
```

---

## ✅ Checklist de Réplication

- [ ] Créer `ClassActiveSessions.tsx`
- [ ] Adapter `loadActiveSessions` pour utiliser `studyService.getActiveSessions()`
- [ ] Afficher la progression `X/Y` avec barre verte
- [ ] Afficher `session_state.masteredCards`
- [ ] Bouton "Reprendre" → Navigation vers `/study/[setId]?resume=[sessionId]`
- [ ] Bouton "Terminer" → Marque comme `completed = true`
- [ ] Afficher mode, titre, temps écoulé, shuffle, start_from
- [ ] Tester la reprise de session depuis my-class
- [ ] Vérifier que la progression se met à jour après chaque réponse

---

## 🔍 Points d'Attention

1. **Filtrage par Classe** : S'assurer que seules les sessions des sets des modules de la classe sont affichées
2. **Progression** : Vérifier que `session_state.masteredCards` est bien sérialisé (Array) depuis la DB
3. **Navigation** : Le lien `/study/[setId]?resume=[sessionId]` fonctionne déjà, pas besoin de modification
4. **RLS** : Les étudiants doivent pouvoir voir leurs propres sessions (déjà en place)

---

## 📚 Références

- `apps/web/components/ActiveSessions.tsx` : Composant de référence
- `apps/web/lib/supabase/study.ts` : Service pour récupérer les sessions
- `apps/web/app/api/study/sessions/active/route.ts` : API route
- `apps/web/app/(dashboard)/study/[id]/page.tsx` : Logique de reprise
- `apps/web/app/(dashboard)/my-class/[id]/page.tsx` : Page à modifier



