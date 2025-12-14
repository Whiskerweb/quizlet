# 🔍 AUDIT COMPLET : Calcul des Minutes d'Étude

## 📋 Résumé Exécutif

Le calcul des minutes d'étude dans l'application présente **plusieurs incohérences et problèmes** qui peuvent expliquer des valeurs incorrectes (comme 197 minutes). Cet audit identifie tous les points de calcul et les problèmes associés.

---

## 🎯 1. SOURCES DE DONNÉES

### 1.1 Table `answers` (Base de données)
- **Champ** : `time_spent` (INTEGER)
- **Unité** : **Millisecondes** (ms)
- **Stockage** : Temps passé sur chaque réponse individuelle
- **Schéma** : `supabase/schema.sql:79`

```sql
time_spent INTEGER, -- milliseconds
```

### 1.2 Table `user_stats` (Base de données)
- **Champ** : `total_study_time` (INTEGER)
- **Unité** : **Minutes**
- **Stockage** : Temps total cumulé de toutes les sessions
- **Schéma** : `supabase/schema.sql:105`

```sql
total_study_time INTEGER DEFAULT 0, -- minutes
```

### 1.3 Table `study_sessions` (Base de données)
- **Champs** : `started_at` (TIMESTAMPTZ), `completed_at` (TIMESTAMPTZ)
- **Utilisation** : Calcul de la durée totale de session
- **Schéma** : `supabase/schema.sql:69-70`

---

## 🔄 2. FLUX DE CALCUL DES MINUTES

### 2.1 Phase 1 : Enregistrement du Temps par Réponse

#### A. Mode Flashcard (`apps/web/app/(dashboard)/study/[id]/page.tsx`)
**❌ PROBLÈME CRITIQUE** : Le temps n'est **PAS mesuré** dans le mode flashcard !

```typescript:1198:1207:apps/web/app/(dashboard)/study/[id]/page.tsx
// Mode flashcard - handleAnswer appelé SANS timeSpent
handleAnswer(false);  // timeSpent = 0 par défaut
handleAnswer(true);    // timeSpent = 0 par défaut
```

**Impact** : Toutes les réponses en mode flashcard ont `time_spent = 0` dans la base de données.

#### B. Mode Quiz (`apps/web/app/(dashboard)/study/[id]/components/QuizMode.tsx`)
**✅ CORRECT** : Le temps est mesuré correctement

```typescript:25:84:apps/web/app/(dashboard)/study/[id]/components/QuizMode.tsx
const [startTime] = useState(Date.now());  // Temps de début

// Lors de la sélection d'une réponse
const timeSpent = Date.now() - startTime;  // Temps en millisecondes
onAnswer(isCorrect, timeSpent);
```

**Unité** : Millisecondes ✅

#### C. Mode Writing (`apps/web/app/(dashboard)/study/[id]/components/WritingMode.tsx`)
**✅ CORRECT** : Le temps est mesuré correctement

```typescript:26:47:apps/web/app/(dashboard)/study/[id]/components/WritingMode.tsx
const [startTime] = useState(Date.now());  // Temps de début

// Lors de la soumission
const timeSpent = Date.now() - startTime;  // Temps en millisecondes
onAnswer(true, timeSpent);
```

**Unité** : Millisecondes ✅

#### D. Mode Match (`apps/web/app/(dashboard)/study/[id]/page.tsx`)
**⚠️ PROBLÈME** : Le temps total est divisé par le nombre de cartes

```typescript:385:403:apps/web/app/(dashboard)/study/[id]/page.tsx
const handleMatchComplete = async (correctCount: number, totalTime: number) => {
  // ...
  for (const card of flashcards) {
    await studyService.submitAnswer(sessionId, {
      flashcardId: card.id,
      isCorrect: true,
      timeSpent: totalTime / flashcards.length,  // ⚠️ Division du temps total
    });
  }
}
```

**Problème** : Si une session match dure 10 minutes pour 20 cartes, chaque carte aura `time_spent = 300000ms` (5 minutes), ce qui donne un total de 100 minutes au lieu de 10.

---

### 2.2 Phase 2 : Sauvegarde dans la Base de Données

#### A. Via API (`apps/web/app/api/study/sessions/[id]/answers/route.ts`)
**✅ CORRECT** : Le temps est sauvegardé tel quel (en millisecondes)

```typescript:41:69:apps/web/app/api/study/sessions/[id]/answers/route.ts
const { flashcardId, isCorrect, timeSpent } = body;

await supabase
  .from('answers')
  .insert({
    session_id: sessionId,
    flashcard_id: flashcardId,
    is_correct: isCorrect,
    time_spent: timeSpent || null,  // ✅ Sauvegardé en millisecondes
  });
```

#### B. Via Fonction Directe (`supabase/create_save_answer_direct_function.sql`)
**✅ CORRECT** : Le temps est sauvegardé tel quel (en millisecondes)

```sql:10:67:supabase/create_save_answer_direct_function.sql
p_time_spent INTEGER DEFAULT NULL  -- En millisecondes

INSERT INTO public.answers (
  session_id,
  flashcard_id,
  is_correct,
  time_spent,  -- ✅ Sauvegardé en millisecondes
  answered_at
)
```

---

### 2.3 Phase 3 : Calcul du Temps Total lors de la Complétion de Session

#### A. Route API Complete (`apps/web/app/api/study/sessions/[id]/complete/route.ts`)
**✅ CORRECT** : Conversion millisecondes → minutes

```typescript:98:110:apps/web/app/api/study/sessions/[id]/complete/route.ts
// Calculate study time in minutes
const totalStudyTime = session.answers.reduce((acc: number, a: any) => 
  acc + (a.time_spent || 0), 0) / 60000;  // ✅ Division par 60000 (ms → min)

const totalStudyTimeMinutes = userStats.total_study_time + Math.round(totalStudyTime);
```

**Calcul** : `Σ(time_spent en ms) / 60000 = minutes`

---

### 2.4 Phase 4 : Affichage sur la Page d'Accueil

#### A. Calcul des Minutes Aujourd'hui (`apps/web/app/(dashboard)/home/page.tsx`)
**⚠️ PROBLÈME MAJEUR** : Utilise `started_at` et `completed_at` au lieu de `time_spent`

```typescript:120:149:apps/web/app/(dashboard)/home/page.tsx
const minutesToday = todaySessions?.reduce((sum: number, s: any, idx: number) => {
  const start = new Date(s.started_at);
  
  if (s.completed_at) {
    const end = new Date(s.completed_at);
    const minutes = Math.floor((end.getTime() - start.getTime()) / 60000);
    const cappedMinutes = Math.max(0, Math.min(minutes, 180)); // Cap at 3h per session
    return sum + cappedMinutes;
  } else {
    // Pour les sessions actives
    const now = new Date();
    const minutes = Math.floor((now.getTime() - start.getTime()) / 60000);
    const cappedMinutes = Math.max(0, Math.min(minutes, 180)); // Cap at 3h
    return sum + cappedMinutes;
  }
}, 0) || 0;
```

**❌ PROBLÈMES IDENTIFIÉS** :

1. **Ne compte PAS le temps réel passé sur les cartes** : Utilise la durée totale de session (de `started_at` à `completed_at`), ce qui inclut :
   - Le temps de navigation entre les cartes
   - Le temps passé à lire les instructions
   - Le temps d'inactivité (si l'utilisateur laisse la page ouverte)
   - Le temps de réflexion avant de répondre (pour les modes quiz/writing)

2. **Double comptage potentiel** : 
   - Le temps est déjà compté dans `user_stats.total_study_time` via `time_spent`
   - Mais ici on recalcule avec `started_at` / `completed_at`
   - Cela peut créer des incohérences

3. **Cap à 3 heures** : Limite arbitraire qui peut masquer des problèmes

4. **Sessions actives** : Pour les sessions non complétées, utilise `Date.now() - started_at`, ce qui peut donner des valeurs très élevées si la session est laissée ouverte

#### B. Calcul des Minutes par Jour (Activité Hebdomadaire)
**⚠️ MÊME PROBLÈME** : Utilise `started_at` et `completed_at`

```typescript:202:209:apps/web/app/(dashboard)/home/page.tsx
const dayMinutes = daySessions.reduce((sum: number, s: any) => {
  if (s.completed_at) {
    const start = new Date(s.started_at);
    const end = new Date(s.completed_at);
    return sum + Math.floor((end.getTime() - start.getTime()) / 60000);
  }
  return sum;
}, 0);
```

**Problème** : Même logique incorrecte que pour `minutesToday`.

---

## 🐛 3. PROBLÈMES IDENTIFIÉS

### 3.1 Problème #1 : Mode Flashcard sans Mesure de Temps
**Sévérité** : 🔴 CRITIQUE
**Impact** : Toutes les réponses en mode flashcard ont `time_spent = 0`

**Fichier** : `apps/web/app/(dashboard)/study/[id]/page.tsx:1198,1207`

**Solution proposée** : Ajouter un `startTime` dans le mode flashcard et mesurer le temps entre le flip et la réponse.

---

### 3.2 Problème #2 : Calcul Basé sur Durée de Session au lieu de Temps Réel
**Sévérité** : 🔴 CRITIQUE
**Impact** : Les minutes affichées ne reflètent pas le temps réel passé sur les cartes

**Fichiers** : 
- `apps/web/app/(dashboard)/home/page.tsx:120-149` (minutesToday)
- `apps/web/app/(dashboard)/home/page.tsx:202-209` (dayMinutes)

**Exemple de problème** :
- Session commencée à 10h00, complétée à 10h30
- Mais l'utilisateur n'a réellement passé que 5 minutes sur les cartes (temps mesuré via `time_spent`)
- L'affichage montrera **30 minutes** au lieu de **5 minutes**

**Solution proposée** : Utiliser `Σ(time_spent)` des réponses au lieu de `completed_at - started_at`.

---

### 3.3 Problème #3 : Mode Match - Division du Temps
**Sévérité** : 🟡 MOYEN
**Impact** : Surestimation du temps pour le mode match

**Fichier** : `apps/web/app/(dashboard)/study/[id]/page.tsx:399`

**Exemple** :
- Session match de 10 minutes pour 20 cartes
- Chaque carte reçoit `time_spent = 600000ms / 20 = 30000ms` (30 secondes)
- Total calculé : `20 × 30000ms = 600000ms = 10 minutes` ✅
- Mais si on compte aussi la durée de session : `30 minutes` ❌

**Solution proposée** : Ne pas diviser le temps, ou utiliser un temps moyen plus réaliste.

---

### 3.4 Problème #4 : Sessions Actives - Temps en Temps Réel
**Sévérité** : 🟡 MOYEN
**Impact** : Les sessions laissées ouvertes comptent indéfiniment

**Fichier** : `apps/web/app/(dashboard)/home/page.tsx:132-142`

**Exemple** :
- Session commencée hier à 10h00, toujours active
- Aujourd'hui à 14h00, le calcul donne : `(14h00 - 10h00) = 4 heures = 240 minutes`
- Mais l'utilisateur n'a peut-être pas utilisé l'application pendant ce temps

**Solution proposée** : 
- Ne compter que les sessions complétées
- Ou utiliser un timeout (ex: max 3h même pour les sessions actives)

---

### 3.5 Problème #5 : Incohérence entre `user_stats.total_study_time` et Affichage
**Sévérité** : 🟡 MOYEN
**Impact** : Deux sources de vérité différentes

**Sources** :
1. `user_stats.total_study_time` : Basé sur `Σ(time_spent)` des réponses ✅
2. Affichage page d'accueil : Basé sur `completed_at - started_at` ❌

**Solution proposée** : Utiliser `user_stats.total_study_time` comme source unique de vérité.

---

## 📊 4. ANALYSE DU CAS "197 MINUTES"

### 4.1 Scénarios Possibles

#### Scénario A : Session Unique Longue
- Session commencée à 10h00, complétée à 13h17 (197 minutes)
- Mais temps réel sur les cartes : peut-être seulement 30 minutes
- **Cause** : Calcul basé sur `completed_at - started_at`

#### Scénario B : Plusieurs Sessions
- 3 sessions de ~65 minutes chacune
- Total : 197 minutes
- **Cause** : Cumul de sessions avec calcul incorrect

#### Scénario C : Session Active
- Session commencée il y a 197 minutes (3h17)
- Toujours active
- **Cause** : Calcul `Date.now() - started_at` pour session non complétée

#### Scénario D : Mode Match avec Division
- Plusieurs sessions match où le temps est divisé
- Accumulation incorrecte
- **Cause** : Problème #3

---

## ✅ 5. RECOMMANDATIONS

### 5.1 Corrections Prioritaires

#### 🔴 PRIORITÉ 1 : Corriger le Calcul des Minutes Aujourd'hui
**Fichier** : `apps/web/app/(dashboard)/home/page.tsx`

**Avant** :
```typescript
const minutes = Math.floor((end.getTime() - start.getTime()) / 60000);
```

**Après** :
```typescript
// Utiliser le temps réel des réponses
const sessionMinutes = s.answers?.reduce((sum: number, a: any) => 
  sum + (a.time_spent || 0), 0) / 60000 || 0;
const minutes = Math.floor(sessionMinutes);
```

#### 🔴 PRIORITÉ 2 : Ajouter la Mesure de Temps en Mode Flashcard
**Fichier** : `apps/web/app/(dashboard)/study/[id]/page.tsx`

**Ajouter** :
```typescript
const [cardStartTime, setCardStartTime] = useState<number | null>(null);

// Quand la carte est retournée
useEffect(() => {
  if (isFlipped && !cardStartTime) {
    setCardStartTime(Date.now());
  }
}, [isFlipped]);

// Quand on répond
const handleAnswer = useCallback(async (isCorrect: boolean, timeSpent: number = 0) => {
  // Si pas de timeSpent fourni, calculer depuis cardStartTime
  if (timeSpent === 0 && cardStartTime) {
    timeSpent = Date.now() - cardStartTime;
  }
  // ... reste du code
  setCardStartTime(null); // Reset pour la prochaine carte
}, [cardStartTime]);
```

#### 🟡 PRIORITÉ 3 : Corriger le Mode Match
**Fichier** : `apps/web/app/(dashboard)/study/[id]/page.tsx:399`

**Avant** :
```typescript
timeSpent: totalTime / flashcards.length,
```

**Après** :
```typescript
// Utiliser le temps réel par carte (si disponible) ou temps moyen
timeSpent: totalTime / flashcards.length, // OK si totalTime est le temps réel total
// OU mieux : tracker le temps par carte individuellement
```

#### 🟡 PRIORITÉ 4 : Limiter les Sessions Actives
**Fichier** : `apps/web/app/(dashboard)/home/page.tsx:132-142`

**Ajouter** :
```typescript
// Pour les sessions actives, ne compter que si commencées aujourd'hui
// ET limiter à un maximum (ex: 3h)
const maxActiveMinutes = 180;
const activeMinutes = Math.min(
  Math.floor((now.getTime() - start.getTime()) / 60000),
  maxActiveMinutes
);
```

---

### 5.2 Améliorations Futures

1. **Ajouter un champ `active_time` dans `study_sessions`** : Temps réellement actif (excluant les pauses)
2. **Tracker les événements d'inactivité** : Détecter quand l'utilisateur quitte la page
3. **Unifier les calculs** : Une seule source de vérité pour les minutes
4. **Ajouter des logs** : Pour déboguer les calculs de temps

---

## 📝 6. CHECKLIST DE VÉRIFICATION

- [ ] Mode flashcard mesure le temps ✅
- [ ] Mode quiz mesure le temps ✅
- [ ] Mode writing mesure le temps ✅
- [ ] Mode match mesure le temps correctement ⚠️
- [ ] `time_spent` est sauvegardé en millisecondes ✅
- [ ] Conversion ms → minutes lors de la complétion ✅
- [ ] Affichage utilise `time_spent` au lieu de durée de session ❌
- [ ] Sessions actives sont limitées ⚠️
- [ ] Cohérence entre `user_stats` et affichage ❌

---

## 🎯 CONCLUSION

Le problème principal est que **l'affichage des minutes utilise la durée totale de session** (`completed_at - started_at`) au lieu du **temps réel passé sur les cartes** (`Σ(time_spent)`). Cela explique pourquoi vous voyez 197 minutes alors que le temps réel est probablement beaucoup moins.

**Action immédiate recommandée** : Corriger le calcul dans `apps/web/app/(dashboard)/home/page.tsx` pour utiliser `time_spent` des réponses.



