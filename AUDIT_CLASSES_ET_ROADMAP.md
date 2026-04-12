# 📊 Audit Système de Classes & Roadmap

Date : 8 Décembre 2025  
Status : ✅ Classes fonctionnelles - Prêt pour développement des fonctionnalités

---

## 🎯 État actuel du système

### ✅ Ce qui fonctionne

#### 1. **Infrastructure de base**
- [x] Tables SQL créées (`classes`, `class_memberships`, `class_modules`)
- [x] RLS policies fonctionnelles (sans récursion)
- [x] Client Supabase singleton (`supabaseBrowser`)
- [x] Services TypeScript (`classes.ts`, `class-modules.ts`)

#### 2. **Fonctionnalités Teacher**
- [x] Création de classes (nom, description, couleur, code unique 6 caractères)
- [x] Liste des classes créées
- [x] Suppression de classes
- [x] Page détaillée `/classes/[id]` avec :
  - [x] Stats cards (élèves, modules, progression, sessions)
  - [x] Onglets (Vue d'ensemble, Élèves, Modules, Évaluations, Analytics)
  - [x] Affichage code classe (masquer/afficher/copier)
  - [x] Liste des élèves inscrits
  - [x] Retrait d'élèves
- [x] Dashboard teacher avec statistiques

#### 3. **Fonctionnalités Student**
- [x] Infrastructure pour rejoindre une classe (code)
- [x] Infrastructure pour voir les classes rejointes

#### 4. **Modules (Folders)**
- [x] Création de modules (dossiers de cardz)
- [x] Table `class_modules` pour lier modules et classes
- [x] Infrastructure pour partager modules avec classes

---

## ❌ Ce qui manque (par priorité)

### 🔴 **Priorité FORTE** (MVP Classe)

#### 1. Partage de modules par le prof
**Status** : ⚠️ Infrastructure existe, UI manquante

**Ce qui existe** :
- Table `class_modules` créée
- Fonction `shareModuleWithClass()` existe dans `class-modules.ts`
- Page `/share-modules` créée mais non fonctionnelle

**Ce qui manque** :
- [ ] UI pour sélectionner modules depuis "Votre espace"
- [ ] Drag & drop ou modal de sélection
- [ ] Duplication du module (pas déplacement)
- [ ] Feedback visuel après partage
- [ ] Affichage des modules partagés dans la classe

**Blockers** : Aucun  
**Estimation** : 2-3 heures  
**Difficulté** : Moyenne

---

#### 2. Élèves peuvent s'entraîner avec les modules de la classe
**Status** : ❌ Non implémenté

**Ce qui existe** :
- Système d'entraînement existant pour modules personnels
- Page `/study/[id]` pour réviser un set
- Système de progression (`card_progress`, `study_sessions`)

**Ce qui manque** :
- [ ] Onglet "Ma classe" pour les élèves
- [ ] Affichage des modules partagés par le prof
- [ ] Accès direct aux sets du module
- [ ] Page d'entraînement dédiée aux modules de classe
- [ ] Distinction UI entre "Mes modules" et "Modules de classe"

**Blockers** : Partage de modules doit être implémenté d'abord  
**Estimation** : 3-4 heures  
**Difficulté** : Moyenne

---

#### 3. Prof reçoit les stats des élèves sur les cardz de classe
**Status** : ❌ Non implémenté

**Ce qui existe** :
- Table `card_progress` (progression individuelle sur chaque carte)
- Table `study_sessions` (sessions d'étude)
- Table `answers` (réponses données)

**Ce qui manque** :
- [ ] Fonction RPC pour agréger stats par élève + module
- [ ] Vue "Analytics" dans la page classe
- [ ] Tableaux de stats :
  - Progression globale par élève
  - Temps passé par élève
  - Cartes maîtrisées vs en apprentissage
  - Taux de réussite
- [ ] Filtres (par module, par élève, par période)
- [ ] Export CSV des données

**Blockers** : Élèves doivent pouvoir s'entraîner d'abord  
**Estimation** : 4-5 heures  
**Difficulté** : Moyenne-Haute

---

### 🟡 **Priorité MOYENNE** (Gamification & Évaluations)

#### 4. Cardz d'évaluation (mode examen)
**Status** : ❌ Non implémenté

**Fonctionnalités** :
- [ ] Mode "Évaluation" distinct du mode "Entraînement"
- [ ] Chronomètre avec limite de temps
- [ ] Blocage de la page (fullscreen API, détection de sortie)
- [ ] Prévention de la triche :
  - Désactivation copier/coller
  - Détection changement d'onglet
  - Enregistrement des tentatives de sortie
- [ ] Correction automatique
- [ ] Note finale sur 20
- [ ] Historique des évaluations

**Tables SQL nécessaires** :
```sql
CREATE TABLE evaluations (
  id UUID PRIMARY KEY,
  class_id UUID REFERENCES classes(id),
  module_id UUID REFERENCES folders(id),
  name TEXT,
  duration_minutes INTEGER,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id)
);

CREATE TABLE evaluation_attempts (
  id UUID PRIMARY KEY,
  evaluation_id UUID REFERENCES evaluations(id),
  student_id UUID REFERENCES profiles(id),
  started_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  score DECIMAL,
  answers JSONB,
  exit_attempts INTEGER DEFAULT 0
);
```

**Blockers** : Système d'entraînement classe doit fonctionner  
**Estimation** : 6-8 heures  
**Difficulté** : Haute

---

#### 5. Système de quiz type Kahoot (positionnement)
**Status** : ❌ Non implémenté

**Fonctionnalités** :
- [ ] Mode "Live Quiz" en temps réel
- [ ] Prof lance le quiz, élèves rejoignent avec un code
- [ ] Questions affichées une par une
- [ ] Timer par question
- [ ] Points basés sur vitesse + exactitude
- [ ] Classement en direct
- [ ] Animations fun (confettis, sons)
- [ ] Résultats agrégés pour le prof

**Architecture technique** :
- **WebSockets** via Supabase Realtime
- **Broadcast** pour synchroniser les questions
- **Presence** pour voir qui est connecté

**Tables SQL nécessaires** :
```sql
CREATE TABLE live_quizzes (
  id UUID PRIMARY KEY,
  class_id UUID REFERENCES classes(id),
  name TEXT,
  join_code TEXT UNIQUE,
  status TEXT, -- 'waiting', 'active', 'finished'
  current_question_index INTEGER DEFAULT 0,
  questions JSONB,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE quiz_participants (
  id UUID PRIMARY KEY,
  quiz_id UUID REFERENCES live_quizzes(id),
  student_id UUID REFERENCES profiles(id),
  score INTEGER DEFAULT 0,
  answers JSONB,
  joined_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Blockers** : Infrastructure classe stable  
**Estimation** : 10-12 heures  
**Difficulté** : Très Haute

---

#### 6. Stats élève pour quiz de positionnement
**Status** : ❌ Non implémenté

**Fonctionnalités** :
- [ ] Historique des quiz passés
- [ ] Évolution du score dans le temps
- [ ] Graphiques de progression
- [ ] Comparaison avec la moyenne de la classe
- [ ] Points forts / points faibles par thème

**Blockers** : Quiz Kahoot doit être implémenté  
**Estimation** : 3-4 heures  
**Difficulté** : Moyenne

---

## 📋 Plan d'implémentation (ordre d'exécution)

### 🎯 **Phase 1 : MVP Classe Fonctionnel** (8-12h)

#### Sprint 1.1 : Partage de modules (2-3h)
1. **Backend** :
   - ✅ Table `class_modules` existe
   - ✅ Fonction `shareModuleWithClass` existe
   - [ ] Tester la fonction

2. **Frontend** :
   - [ ] Créer modal "Partager avec une classe"
   - [ ] Liste des classes du prof
   - [ ] Liste des modules du prof
   - [ ] Bouton "Partager" dans "Votre espace"
   - [ ] Affichage des modules partagés dans `/classes/[id]` (onglet Modules)

3. **UX** :
   - [ ] Feedback de succès
   - [ ] Possibilité de retirer un module d'une classe
   - [ ] Badge "Partagé avec X classes" sur les modules

**Livrable** : Prof peut partager un module avec une classe

---

#### Sprint 1.2 : Élèves accèdent aux modules (3-4h)
1. **Backend** :
   - [ ] Fonction RPC `get_class_modules_for_student(class_id)`
   - [ ] Vérifier RLS pour accès étudiant

2. **Frontend** :
   - [ ] Page `/my-classes` pour les élèves
   - [ ] Liste des classes rejointes
   - [ ] Clic sur classe → voir modules partagés
   - [ ] Clic sur module → voir sets
   - [ ] Bouton "S'entraîner" → `/study/[setId]`

3. **UX** :
   - [ ] Badge "Nouveau" sur modules non consultés
   - [ ] Progression visible (X/Y cartes maîtrisées)

**Livrable** : Élèves peuvent s'entraîner avec les modules du prof

---

#### Sprint 1.3 : Stats élèves pour le prof (4-5h)
1. **Backend** :
   - [ ] Fonction RPC `get_class_analytics(class_id)`
     - Élèves actifs / inactifs
     - Temps passé par élève
     - Cartes maîtrisées par élève
     - Taux de réussite moyen
   - [ ] Fonction RPC `get_student_progress(class_id, student_id, module_id)`

2. **Frontend** :
   - [ ] Onglet "Analytics" dans `/classes/[id]`
   - [ ] Tableau des élèves avec métriques
   - [ ] Graphiques de progression
   - [ ] Filtres (module, période)
   - [ ] Bouton "Exporter CSV"

3. **UX** :
   - [ ] Indicateurs visuels (rouge/vert pour progression)
   - [ ] Alerte élèves en difficulté

**Livrable** : Prof voit les stats de ses élèves en temps réel

---

### 🎮 **Phase 2 : Évaluations & Gamification** (16-20h)

#### Sprint 2.1 : Cardz d'évaluation (6-8h)
1. **Backend** :
   - [ ] Tables `evaluations` et `evaluation_attempts`
   - [ ] RPC `create_evaluation`, `submit_evaluation`
   - [ ] RLS policies

2. **Frontend** :
   - [ ] Page création évaluation pour prof
   - [ ] Mode "Examen" pour élève (fullscreen, anti-triche)
   - [ ] Timer
   - [ ] Correction automatique
   - [ ] Affichage résultats

**Livrable** : Prof peut créer et administrer des évaluations

---

#### Sprint 2.2 : Quiz type Kahoot (10-12h)
1. **Backend** :
   - [ ] Tables `live_quizzes`, `quiz_participants`
   - [ ] Supabase Realtime setup
   - [ ] Broadcast questions
   - [ ] Calcul scores en temps réel

2. **Frontend** :
   - [ ] Page création quiz (prof)
   - [ ] Page rejoindre quiz (élève)
   - [ ] Interface live avec timer
   - [ ] Classement temps réel
   - [ ] Animations

**Livrable** : Quiz interactifs en direct

---

#### Sprint 2.3 : Stats quiz (3-4h)
1. **Backend** :
   - [ ] Agrégation données quiz
   - [ ] Évolution dans le temps

2. **Frontend** :
   - [ ] Dashboard élève
   - [ ] Graphiques

**Livrable** : Élèves voient leur progression

---

## 🗄️ Architecture SQL à ajouter

### Phase 1 (optionnel, peut utiliser tables existantes)
Aucune table supplémentaire nécessaire pour Phase 1.
Tables existantes suffisantes :
- `classes`
- `class_memberships`
- `class_modules`
- `folders` (modules)
- `sets` (cardz)
- `card_progress`
- `study_sessions`
- `answers`

### Phase 2 (requis)
```sql
-- Évaluations
CREATE TABLE evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  module_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  allow_review BOOLEAN DEFAULT false,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE evaluation_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id UUID REFERENCES evaluations(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  score DECIMAL(5,2),
  max_score DECIMAL(5,2),
  answers JSONB,
  exit_attempts INTEGER DEFAULT 0,
  time_spent_seconds INTEGER
);

-- Quiz live
CREATE TABLE live_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  join_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'waiting', -- 'waiting', 'active', 'finished'
  current_question_index INTEGER DEFAULT 0,
  questions JSONB NOT NULL,
  created_by UUID REFERENCES profiles(id),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE quiz_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES live_quizzes(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id),
  score INTEGER DEFAULT 0,
  answers JSONB DEFAULT '[]'::jsonb,
  rank INTEGER,
  joined_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE quiz_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID REFERENCES quiz_participants(id) ON DELETE CASCADE,
  question_index INTEGER NOT NULL,
  answer TEXT,
  is_correct BOOLEAN,
  time_taken_ms INTEGER,
  points_earned INTEGER DEFAULT 0,
  answered_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🎨 UI/UX à créer

### Phase 1
1. **Modal "Partager module"** (prof)
   - Liste classes à gauche
   - Liste modules à droite
   - Bouton "Partager"

2. **Page "Mes classes"** (élève)
   - Cards des classes rejointes
   - Clic → Voir modules

3. **Onglet "Analytics"** (prof)
   - Tableau élèves
   - Graphiques
   - Filtres

### Phase 2
4. **Page "Créer évaluation"** (prof)
   - Sélection module
   - Configuration (durée, dates)

5. **Mode "Examen"** (élève)
   - Fullscreen
   - Timer en haut
   - Anti-triche

6. **Page "Créer quiz live"** (prof)
   - Sélection questions
   - Code de rejointe

7. **Interface "Quiz live"** (élève)
   - Questions temps réel
   - Classement

---

## ⏱️ Estimations totales

| Phase | Composant | Temps | Difficulté |
|-------|-----------|-------|------------|
| **Phase 1** | Partage modules | 2-3h | Moyenne |
| | Accès élèves | 3-4h | Moyenne |
| | Stats prof | 4-5h | Moyenne-Haute |
| **Total Phase 1** | | **9-12h** | |
| | | | |
| **Phase 2** | Évaluations | 6-8h | Haute |
| | Quiz Kahoot | 10-12h | Très Haute |
| | Stats quiz | 3-4h | Moyenne |
| **Total Phase 2** | | **19-24h** | |
| | | | |
| **TOTAL GÉNÉRAL** | | **28-36h** | |

---

## 🚀 Recommandation : Commencer par quoi ?

### **Prochaine étape immédiate : Sprint 1.1 (Partage de modules)**

**Pourquoi** :
- ✅ Infrastructure déjà en place
- ✅ Pas de blockers
- ✅ Impact immédiat visible
- ✅ Débloque Sprint 1.2

**Actions concrètes** :
1. Créer modal de partage dans "Votre espace"
2. Lister classes et modules
3. Appeler `shareModuleWithClass()`
4. Afficher modules partagés dans `/classes/[id]`

**Temps estimé** : 2-3 heures  
**Complexité** : ⭐⭐⭐ (3/5)

---

## ✅ Checklist de démarrage Sprint 1.1

- [ ] Créer composant `ShareModuleModal.tsx`
- [ ] Ajouter bouton "Partager" dans dashboard prof
- [ ] Implémenter logique de partage
- [ ] Tester partage de module
- [ ] Afficher modules partagés dans classe
- [ ] Ajouter possibilité de retirer module

---

**Prêt à commencer le Sprint 1.1 ?** 🚀

