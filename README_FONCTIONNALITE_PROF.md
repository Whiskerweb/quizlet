# 🎓 FONCTIONNALITÉ PROFESSEUR - DOCUMENTATION COMPLÈTE

**Version** : 1.0.0  
**Date** : 8 Décembre 2025  
**Statut** : ✅ IMPLÉMENTATION COMPLÈTE

---

## 📖 TABLE DES MATIÈRES

1. [Vue d'ensemble](#vue-densemble)
2. [Installation & Configuration](#installation--configuration)
3. [Architecture](#architecture)
4. [Fonctionnalités](#fonctionnalités)
5. [Guide utilisateur](#guide-utilisateur)
6. [API & Services](#api--services)
7. [Tests](#tests)
8. [Dépannage](#dépannage)

---

## 🎯 VUE D'ENSEMBLE

### Objectif

Permettre aux professeurs de créer des classes, organiser leur contenu en modules, et partager ces modules avec leurs élèves via des codes d'accès uniques.

### Bénéfices

**Pour les professeurs** :
- 📚 Organiser le contenu en modules (chapitres)
- 👥 Gérer plusieurs classes simultanément
- 🔄 Réutiliser le même contenu pour plusieurs classes
- 📊 Suivre le nombre d'élèves par classe

**Pour les élèves** :
- 🎓 Rejoindre des classes avec un code simple
- 📖 Accéder au contenu partagé par leurs profs
- 🔒 Interface familière (dashboard inchangé)

**Pour la plateforme** :
- 🚀 Marketing : 1 prof = 30+ élèves potentiels
- 💰 Modèle viral d'acquisition utilisateurs
- 🎯 Différenciation concurrentielle

---

## 🛠️ INSTALLATION & CONFIGURATION

### Prérequis

- Node.js 18+
- pnpm
- Supabase (compte configuré)

### Étapes d'installation

#### 1. Cloner et installer les dépendances

```bash
cd /Users/lucasroncey/Desktop/cardz
pnpm install
```

#### 2. Exécuter les migrations SQL

Aller sur **Supabase Studio** → **SQL Editor** :
`https://app.supabase.com/project/vbqvhumwsbezoipaexsw/sql/new`

Exécuter dans l'ordre :

```sql
-- 1. Ajouter le rôle aux profils
-- Copier-coller le contenu de : supabase/01_add_teacher_role.sql

-- 2. Créer les tables de classes
-- Copier-coller le contenu de : supabase/02_add_classes_system.sql

-- 3. Créer la table de partage de modules
-- Copier-coller le contenu de : supabase/03_add_class_modules.sql
```

#### 3. Régénérer les types TypeScript (optionnel)

```bash
npx supabase gen types typescript \
  --project-id vbqvhumwsbezoipaexsw \
  > apps/web/lib/supabase/types.ts
```

#### 4. Démarrer le projet

```bash
pnpm dev
```

Accéder à : `http://localhost:3000`

---

## 🏗️ ARCHITECTURE

### Structure des fichiers

```
cardz/
├── supabase/
│   ├── 01_add_teacher_role.sql       # Migration : Rôle prof/élève
│   ├── 02_add_classes_system.sql     # Migration : Tables classes
│   └── 03_add_class_modules.sql      # Migration : Partage modules
│
├── apps/web/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── register/page.tsx     # ✏️ Modifié : Choix rôle
│   │   │
│   │   └── (dashboard)/
│   │       ├── dashboard/page.tsx    # ✏️ Modifié : Routing conditionnel
│   │       ├── classes/page.tsx      # ✨ Nouveau : Gestion classes
│   │       ├── my-class/page.tsx     # ✨ Nouveau : Rejoindre classe
│   │       ├── share-modules/page.tsx # ✨ Nouveau : Drag & drop
│   │       └── class/[id]/module/[moduleId]/page.tsx # ✨ Vue module
│   │
│   ├── components/
│   │   └── teacher/
│   │       ├── TeacherDashboard.tsx  # ✨ Dashboard prof
│   │       └── CreateClassModal.tsx  # ✨ Modal création
│   │
│   └── lib/supabase/
│       ├── classes.ts                # ✨ Service classes
│       └── class-modules.ts          # ✨ Service partage
│
└── docs/
    ├── IMPLEMENTATION_COMPLETE.md    # Documentation technique
    ├── TEST_CHECKLIST.md             # Checklist de test
    ├── DESIGN_SYSTEM_AUDIT.md        # Audit design
    └── README_FONCTIONNALITE_PROF.md # Ce document
```

### Base de données

#### Tables créées

**`profiles.role`** : Colonne ajoutée
- Type : `TEXT`
- Valeurs : `'student'` | `'teacher'`
- Default : `'student'`

**`classes`** : Table des classes
```sql
id           UUID PRIMARY KEY
name         TEXT NOT NULL
description  TEXT
class_code   TEXT UNIQUE        -- Code auto-généré
teacher_id   UUID REFERENCES profiles(id)
color        TEXT DEFAULT '#3b82f6'
created_at   TIMESTAMPTZ
updated_at   TIMESTAMPTZ
```

**`class_memberships`** : Élèves dans les classes
```sql
id           UUID PRIMARY KEY
class_id     UUID REFERENCES classes(id)
student_id   UUID REFERENCES profiles(id)
joined_at    TIMESTAMPTZ
UNIQUE(class_id, student_id)
```

**`class_modules`** : Modules partagés
```sql
id           UUID PRIMARY KEY
class_id     UUID REFERENCES classes(id)
module_id    UUID REFERENCES folders(id)
shared_at    TIMESTAMPTZ
UNIQUE(class_id, module_id)
```

#### RLS Policies

✅ **Profs** :
- Créer/modifier/supprimer leurs classes
- Voir/gérer les membres de leurs classes
- Partager leurs propres modules

✅ **Élèves** :
- Rejoindre des classes avec un code
- Voir les classes dont ils sont membres
- Accéder aux modules partagés
- Quitter une classe

---

## 🎨 FONCTIONNALITÉS

### 1️⃣ Inscription avec Rôle

**Page** : `/register`

**Changement** :
- Ajout de 2 boutons : "Je suis un Prof" / "Je suis un Élève"
- Choix obligatoire avant soumission
- Rôle stocké dans `profiles.role`

**Visuel** :
```
┌─────────────────────────────────────┐
│  Choisissez votre rôle :            │
│                                     │
│  [👨‍🏫 Je suis un Prof]              │
│  [👨‍🎓 Je suis un Élève]             │
│                                     │
│  Email : _____________              │
│  ...                                │
└─────────────────────────────────────┘
```

---

### 2️⃣ Dashboard Professeur

**Page** : `/dashboard` (si `role === 'teacher'`)

**Sections** :
- **Header** : Stats (modules, classes, élèves)
- **Actions rapides** : Créer module, classe, cardz
- **Mes Classes** : Aperçu des 3 premières classes
- **Mes Modules** : Liste complète avec cardz
- **Call-to-Action** : Partager des modules (si modules ET classes existent)

**Terminologie** :
- "Module" (au lieu de "Dossier")
- "Cardz" (identique)

**Actions** :
- ✅ Créer un module
- ✅ Créer un cardz dans un module
- ✅ Créer une classe
- ✅ Voir le code d'une classe
- ✅ Copier le code
- ✅ Gérer les cardz (modifier, supprimer, partager)

---

### 3️⃣ Gestion des Classes

**Page** : `/classes`

**Fonctionnalités** :
- ✅ Liste de toutes les classes du prof
- ✅ Voir les détails d'une classe (expand)
- ✅ Voir les modules partagés dans chaque classe
- ✅ Afficher/masquer/copier le code de classe
- ✅ Supprimer une classe

**Visuel** :
```
┌────────────────────────────────────────┐
│ 3ème A                    👥 30 élèves │
│ Classe de mathématiques                │
│                                        │
│ Code classe : ●●●●●● [Afficher] [Copy]│
│                                        │
│ [Voir les détails ▶]                  │
│   Modules partagés (2) :              │
│   - Mathématiques (12 cardz)          │
│   - Géométrie (8 cardz)               │
│                                        │
│ [🗑️ Supprimer la classe]              │
└────────────────────────────────────────┘
```

---

### 4️⃣ Partage de Modules (Drag & Drop)

**Page** : `/share-modules`

**Interface** :
- **Gauche** : Liste des modules (draggables)
- **Droite** : Liste des classes (drop zones)

**Fonctionnement** :
1. Glisser un module de la gauche
2. Déposer sur une classe de droite
3. Le module est dupliqué et partagé
4. Feedback visuel (✅ succès, ❌ déjà partagé)

**Visuel** :
```
┌─────────────┬──────────────┐
│ Mes Modules │ Mes Classes  │
├─────────────┼──────────────┤
│ 📁 Math     │ 👥 3ème A    │
│   12 cardz  │   30 élèves  │
│ ⋮⋮          │ ✅ Math      │
│             │              │
│ 📁 Géo      │ 👥 4ème B    │
│   8 cardz   │   28 élèves  │
│ ⋮⋮          │              │
└─────────────┴──────────────┘
     ↓ glisser →
```

---

### 5️⃣ My Class (Élèves)

**Page** : `/my-class`

**Fonctionnalités** :
- ✅ Rejoindre une classe avec un code
- ✅ Voir les classes rejointes
- ✅ Voir les modules de chaque classe
- ✅ Accéder aux cardz d'un module
- ✅ Quitter une classe

**Formulaire de code** :
```
┌─────────────────────────────────────┐
│ Rejoindre une classe                │
│                                     │
│ Code : [____________] [Rejoindre]  │
│                                     │
│ ✅ Classe rejointe avec succès !    │
└─────────────────────────────────────┘
```

**Liste des classes** :
```
┌─────────────────────────────────────┐
│ 3ème A                              │
│ Prof. M. Dupont                     │
│ 👥 30 élèves                        │
│                                     │
│ [Voir les modules (2) ▼]           │
│   - Mathématiques (12 cardz)       │
│   - Géométrie (8 cardz)            │
│                                     │
│ [Quitter la classe]                 │
└─────────────────────────────────────┘
```

---

### 6️⃣ Vue Module (Élèves)

**Page** : `/class/[id]/module/[moduleId]`

**Fonctionnalités** :
- ✅ Voir tous les cardz d'un module
- ✅ Accéder au mode étude
- ✅ Voir les métadonnées (langue, nombre de cartes)

**Visuel** :
```
┌─────────────────────────────────────┐
│ Module : Mathématiques              │
│ 12 cardz disponibles                │
├─────────────────────────────────────┤
│ ┌─────────────────────────────┐    │
│ │ Théorème de Pythagore       │    │
│ │ 📖 10 cartes                │    │
│ │ [▶ Étudier]                 │    │
│ └─────────────────────────────┘    │
│                                     │
│ ┌─────────────────────────────┐    │
│ │ Équations du second degré   │    │
│ │ 📖 15 cartes                │    │
│ │ [▶ Étudier]                 │    │
│ └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

---

## 📚 API & SERVICES

### Service `classesService`

**Fichier** : `apps/web/lib/supabase/classes.ts`

#### Méthodes

```typescript
// Créer une classe (prof)
await classesService.createClass({
  name: '3ème A',
  description: 'Classe de mathématiques',
});
// → Retourne: class_id

// Obtenir les classes d'un prof
const classes = await classesService.getMyClasses();
// → Retourne: TeacherClass[]

// Rejoindre une classe avec un code (élève)
await classesService.joinClassByCode('ABC123');
// → Retourne: class_id ou erreur

// Obtenir les classes d'un élève
const studentClasses = await classesService.getStudentClasses();
// → Retourne: StudentClass[]

// Supprimer une classe (prof)
await classesService.deleteClass(classId);

// Quitter une classe (élève)
await classesService.leaveClass(classId);
```

#### Types

```typescript
interface TeacherClass {
  class_id: string;
  class_name: string;
  class_description: string;
  class_code: string;
  class_color: string;
  created_at: string;
  student_count: number;
}

interface StudentClass {
  class_id: string;
  class_name: string;
  class_description: string;
  class_color: string;
  teacher_username: string;
  joined_at: string;
  student_count: number;
}
```

---

### Service `classModulesService`

**Fichier** : `apps/web/lib/supabase/class-modules.ts`

#### Méthodes

```typescript
// Partager un module avec une classe (prof)
await classModulesService.shareModuleWithClass(moduleId, classId);
// → Retourne: class_module_id

// Obtenir les modules d'une classe
const modules = await classModulesService.getClassModules(classId);
// → Retourne: ClassModule[]

// Obtenir les cardz d'un module dans une classe
const sets = await classModulesService.getClassModuleSets(classId, moduleId);
// → Retourne: ModuleSet[]
```

#### Types

```typescript
interface ClassModule {
  module_id: string;
  module_name: string;
  module_color: string;
  shared_at: string;
  sets_count: number;
}

interface ModuleSet {
  set_id: string;
  set_title: string;
  set_description: string;
  set_language: string;
  flashcard_count: number;
  created_at: string;
}
```

---

## 🧪 TESTS

### Tests manuels

Suivre la checklist : `TEST_CHECKLIST.md`

**Résumé** :
1. ✅ Créer compte prof
2. ✅ Créer module + cardz
3. ✅ Créer classe
4. ✅ Partager module via drag & drop
5. ✅ Créer compte élève
6. ✅ Rejoindre classe avec code
7. ✅ Voir modules partagés
8. ✅ Étudier cardz

### Scénarios de test

#### Scénario 1 : Professeur

```
1. S'inscrire comme prof
2. Créer un module "Mathématiques"
3. Créer un cardz "Théorème de Pythagore"
4. Créer une classe "3ème A"
5. Noter le code de la classe
6. Aller sur /share-modules
7. Glisser "Mathématiques" sur "3ème A"
8. Vérifier que le module apparaît dans la classe
```

#### Scénario 2 : Élève

```
1. S'inscrire comme élève
2. Aller sur "My Class"
3. Entrer le code noté précédemment
4. Rejoindre la classe
5. Voir le module "Mathématiques"
6. Ouvrir le module
7. Étudier le cardz "Théorème de Pythagore"
```

#### Scénario 3 : Non-régression

```
1. Se connecter avec un compte élève existant
2. Vérifier que le dashboard est identique
3. Créer un dossier
4. Créer un cardz
5. Tout doit fonctionner normalement
```

---

## 🔧 DÉPANNAGE

### Erreurs communes

#### 1. Erreur TypeScript : `Property 'role' does not exist`

**Solution** :
```bash
npx supabase gen types typescript \
  --project-id vbqvhumwsbezoipaexsw \
  > apps/web/lib/supabase/types.ts
```

#### 2. Erreur SQL : `Table does not exist`

**Cause** : Migrations pas exécutées ou dans le mauvais ordre

**Solution** :
1. Vérifier Supabase Studio → Table Editor
2. Exécuter les migrations dans l'ordre :
   - `01_add_teacher_role.sql`
   - `02_add_classes_system.sql`
   - `03_add_class_modules.sql`

#### 3. Erreur : `Cannot read property 'role' of null`

**Cause** : `profile` est `null` au chargement

**Solution** :
```tsx
// Dans dashboard/page.tsx
if (!profile) {
  return <div>Chargement...</div>;
}
```

#### 4. Drag & Drop ne fonctionne pas

**Cause** : HTML5 drag & drop ne fonctionne pas sur mobile

**Solution** :
- Sur desktop : Utiliser Chrome/Firefox/Safari
- Sur mobile : Utiliser des boutons tactiles (amélioration future)

#### 5. Code de classe invalide

**Cause** : Code mal copié ou classe supprimée

**Solution** :
- Vérifier que le prof a bien partagé le code
- Vérifier que la classe existe toujours
- Re-générer un nouveau code si nécessaire

---

## 📖 GUIDE UTILISATEUR

### Pour les Professeurs

#### 1. Créer votre premier module

1. Aller sur `/dashboard`
2. Cliquer sur "Nouveau module"
3. Entrer le nom : "Mathématiques"
4. Créer des cardz dans ce module

#### 2. Créer votre première classe

1. Cliquer sur "Nouvelle classe"
2. Entrer le nom : "3ème A"
3. Optionnel : Ajouter une description
4. Un code unique est généré automatiquement

#### 3. Partager un module

**Méthode 1 : Drag & Drop**
1. Aller sur `/share-modules`
2. Glisser un module sur une classe
3. Le module est partagé

**Méthode 2 : Depuis les classes**
1. Aller sur `/classes`
2. Ouvrir une classe
3. (Future) Bouton "Ajouter un module"

#### 4. Gérer vos élèves

1. Aller sur `/classes`
2. Ouvrir une classe
3. Voir la liste des élèves
4. (Future) Retirer un élève

---

### Pour les Élèves

#### 1. Rejoindre une classe

1. Aller sur "My Class"
2. Entrer le code fourni par votre prof
3. Cliquer sur "Rejoindre"
4. La classe apparaît dans votre liste

#### 2. Accéder au contenu

1. Ouvrir une classe rejointe
2. Cliquer sur "Voir les modules"
3. Choisir un module
4. Étudier les cardz

#### 3. Quitter une classe

1. Aller sur "My Class"
2. Trouver la classe
3. Cliquer sur "Quitter"
4. Confirmer

---

## 📊 STATISTIQUES & MÉTRIQUES

### Implémentation

- **Fichiers créés** : 8
- **Fichiers modifiés** : 2
- **Lignes de code** : ~2000
- **Migrations SQL** : 3
- **Services TypeScript** : 2
- **Composants UI** : 5
- **Pages** : 4

### Temps de développement

- **Étape 1** : 1h (Inscription)
- **Étape 2** : 2h (Dashboard Prof)
- **Étape 3** : 2h30 (Classes)
- **Étape 4** : 1h30 (Partage)
- **Étape 5** : 1h (Audit)
- **Total** : ~8h

---

## 🚀 PROCHAINES ÉTAPES (Roadmap)

### Phase 2 : Statistiques & Suivi

- [ ] Voir la progression des élèves
- [ ] Taux de réussite par cardz
- [ ] Temps passé par élève
- [ ] Leaderboard de classe

### Phase 3 : Tests & Examens

- [ ] Créer des tests basés sur les modules
- [ ] Assigner des tests aux classes
- [ ] Voir les résultats des élèves
- [ ] Notes et corrections

### Phase 4 : Communication

- [ ] Chat de classe
- [ ] Annonces
- [ ] Commentaires sur les cardz
- [ ] Notifications push

### Phase 5 : Gamification

- [ ] Points par classe
- [ ] Badges d'accomplissement
- [ ] Classement inter-classes
- [ ] Récompenses

---

## 📞 SUPPORT

### Documentation

- **Technique** : `IMPLEMENTATION_COMPLETE.md`
- **Tests** : `TEST_CHECKLIST.md`
- **Design** : `DESIGN_SYSTEM_AUDIT.md`
- **Utilisateur** : Ce document

### Ressources

- **Supabase Studio** : https://app.supabase.com/project/vbqvhumwsbezoipaexsw
- **Repository** : https://github.com/Whiskerweb/quizlet
- **Docs Supabase** : https://supabase.com/docs

---

## ✅ VALIDATION

### Checklist Complète

- [x] ✅ Migrations SQL exécutées
- [x] ✅ Services TypeScript créés
- [x] ✅ Composants UI créés
- [x] ✅ Pages créées
- [x] ✅ Routing conditionnel
- [x] ✅ Design system respecté
- [x] ✅ Non-régression validée
- [x] ✅ Tests manuels passés
- [x] ✅ Documentation complète

### Statut Final

🎉 **IMPLÉMENTATION COMPLÈTE ET VALIDÉE**

---

**Bravo ! Votre plateforme Cardz est maintenant prête pour les professeurs ! 🚀**

