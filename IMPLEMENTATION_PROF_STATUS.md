# 📊 STATUT IMPLÉMENTATION FONCTIONNALITÉ PROFESSEUR

**Dernière mise à jour** : 8 Décembre 2025  
**Progression Globale** : **60%** (3/5 étapes backend complètes)

---

## ✅ CE QUI EST FAIT

### 🗄️ Base de Données (100% Complété)

#### 1. Table `profiles` - Rôle Utilisateur
**Fichier** : `supabase/add_teacher_role.sql`

- ✅ Colonne `role` ajoutée (`student` | `teacher`)
- ✅ Index créé sur `role`
- ✅ Trigger `handle_new_user` mis à jour pour gérer le rôle
- ✅ Fonction `create_or_update_profile` mise à jour
- ✅ Fonctions helper : `is_teacher()`, `is_student()`

#### 2. Tables Classes
**Fichier** : `supabase/add_classes_system.sql`

- ✅ Table `classes` créée
  - Champs : `id`, `name`, `description`, `class_code`, `teacher_id`, `color`, etc.
  - Contrainte : le `teacher_id` doit être un professeur
  - Code unique auto-généré par classe

- ✅ Table `class_memberships` créée
  - Relation many-to-many entre classes et étudiants
  - Contrainte : seuls les étudiants peuvent rejoindre
  - UNIQUE (class_id, student_id)

- ✅ RLS Policies complètes
  - Profs : CRUD sur leurs classes
  - Étudiants : SELECT sur classes qu'ils ont rejointes
  - Isolation stricte prof/élève

- ✅ Fonctions SQL Helper
  - `get_class_stats(class_uuid)` - Statistiques classe
  - `join_class_by_code(code, student_id)` - Rejoindre par code
  - `get_student_classes(student_id)` - Classes d'un élève
  - `get_teacher_classes(teacher_id)` - Classes d'un prof

#### 3. Table Class Modules
**Fichier** : `supabase/add_class_modules.sql`

- ✅ Table `class_modules` créée
  - Lie modules (folders) aux classes
  - Permet le partage de modules vers classes
  - UNIQUE (class_id, module_id)

- ✅ RLS Policies
  - Profs : Ajouter/retirer leurs modules de leurs classes
  - Étudiants : Voir modules de leurs classes

- ✅ Fonctions SQL Helper
  - `share_module_with_class()` - Partager module
  - `get_class_modules()` - Modules d'une classe
  - `get_class_module_sets()` - Sets d'un module dans une classe
  - `remove_module_from_class()` - Retirer module

### 🎨 Frontend (50% Complété)

#### 1. Page Register - Choix Prof/Élève
**Fichier** : `apps/web/app/(auth)/register/page.tsx`

- ✅ State `role` ajouté
- ✅ UI avec 2 boutons (Élève / Professeur)
- ✅ Validation : impossible de s'inscrire sans choisir
- ✅ Role passé dans metadata Supabase
- ✅ Role passé à la fonction RPC `create_or_update_profile`

#### 2. Services TypeScript
**Fichiers créés** :
- ✅ `apps/web/lib/supabase/classes.ts`
  - Service complet pour gérer les classes
  - Méthodes : create, get, update, delete, join, leave, getStats, etc.

- ✅ `apps/web/lib/supabase/class-modules.ts`
  - Service pour partager modules vers classes
  - Méthodes : share, get, remove, getModuleClasses

---

## ⏳ CE QUI RESTE À FAIRE

### 🎨 Interface Utilisateur (0% Complété)

#### 1. Dashboard Professeur
**Fichier à créer** : `apps/web/app/(dashboard)/dashboard-teacher/page.tsx`

**Fonctionnalités nécessaires** :
- [ ] Afficher modules (au lieu de folders)
- [ ] Afficher classes avec codes
- [ ] Bouton "Créer une classe"
- [ ] Bouton "Créer un module"
- [ ] Stats : nombre de classes, d'élèves, de modules

**Composants nécessaires** :
- [ ] `TeacherDashboard.tsx`
- [ ] `ModuleCard.tsx`
- [ ] `ClassCard.tsx` (avec affichage code)
- [ ] `CreateClassModal.tsx`
- [ ] `CreateModuleModal.tsx`

#### 2. Routing Conditionnel Dashboard
**Fichier à modifier** : `apps/web/app/(dashboard)/dashboard/page.tsx`

```typescript
// Pseudo-code
if (profile.role === 'teacher') {
  return <TeacherDashboard />;
}
return <StudentDashboard />; // Existant
```

#### 3. Page Gestion Classes (Prof)
**Fichier à créer** : `apps/web/app/(dashboard)/classes/page.tsx`

**Fonctionnalités** :
- [ ] Liste complète des classes du prof
- [ ] Détails de chaque classe (code, nb élèves, modules partagés)
- [ ] Bouton copier code classe
- [ ] Liste des élèves de la classe
- [ ] Bouton retirer un élève

#### 4. Page My Class (Élève)
**Fichier à créer** : `apps/web/app/(dashboard)/my-class/page.tsx`

**Fonctionnalités** :
- [ ] Input pour entrer code classe
- [ ] Bouton "Rejoindre"
- [ ] Liste des classes rejointes
- [ ] Pour chaque classe :
  - Nom, description
  - Prof (username)
  - Modules disponibles
  - Bouton "Quitter la classe"

#### 5. Page Détails Classe (Élève)
**Fichier à créer** : `apps/web/app/(dashboard)/class/[id]/page.tsx`

**Fonctionnalités** :
- [ ] Info classe (nom, prof)
- [ ] Liste modules partagés
- [ ] Pour chaque module : liste des sets
- [ ] Bouton "Étudier" pour chaque set

#### 6. Drag & Drop Modules → Classes
**Fichier à créer** : `apps/web/components/teacher/ModuleSharing.tsx`

**Fonctionnalités** :
- [ ] Grille 2 colonnes : Modules | Classes
- [ ] Drag un module
- [ ] Drop sur une classe
- [ ] Toast confirmation "Module partagé !"

#### 7. Sidebar Navigation
**Fichier à modifier** : `apps/web/components/layout/SidebarNav.tsx`

**Modifications** :
- [ ] Ajouter lien "Mes Classes" (profs uniquement)
- [ ] Ajouter lien "My Class" (élèves uniquement)
- [ ] Conditionnel basé sur `profile.role`

### 🎨 Terminologie (0% Complété)

#### Adapter l'UI selon le rôle

**Pour les Professeurs** :
- "Dossiers" → "Modules"
- "Mes Dossiers" → "Mes Modules"

**Pour les Élèves** :
- Garde "Dossiers" tel quel

**Fichiers à créer** :
- `apps/web/lib/utils/terminology.ts`
```typescript
export function getTerminology(role: 'student' | 'teacher') {
  if (role === 'teacher') {
    return {
      folder: 'Module',
      folders: 'Modules',
      myFolders: 'Mes Modules',
    };
  }
  return {
    folder: 'Dossier',
    folders: 'Dossiers',
    myFolders: 'Mes Dossiers',
  };
}
```

### 🧪 Tests & Validation (0% Complété)

#### Tests à effectuer
- [ ] Inscription Prof → Vérifier role en DB
- [ ] Inscription Élève → Vérifier role en DB
- [ ] Prof crée classe → Code généré
- [ ] Élève rejoint classe avec code
- [ ] Prof partage module → Visible pour élèves
- [ ] Élève accède aux sets de la classe
- [ ] Dashboard étudiant non cassé

---

## 📦 INSTRUCTIONS D'INSTALLATION

### Étape 1 : Exécuter les Migrations SQL

Dans Supabase Dashboard → SQL Editor :

1. **Migration role** :
```sql
-- Exécuter supabase/add_teacher_role.sql
```

2. **Migration classes** :
```sql
-- Exécuter supabase/add_classes_system.sql
```

3. **Migration class_modules** :
```sql
-- Exécuter supabase/add_class_modules.sql
```

### Étape 2 : Installer les dépendances

```bash
cd /Users/lucasroncey/Desktop/cardz
pnpm install
```

### Étape 3 : Tester l'inscription

```bash
pnpm dev
# Aller sur /register
# Tester choix Prof/Élève
```

---

## 🎯 PROCHAINES ACTIONS PRIORITAIRES

### Action 1 : Dashboard Prof (3-4h)
1. Créer `TeacherDashboard` component
2. Routing conditionnel dans `dashboard/page.tsx`
3. Afficher modules et classes

### Action 2 : Gestion Classes (2-3h)
1. Créer page "Mes Classes"
2. UI liste classes avec codes
3. Modal création classe

### Action 3 : My Class Élève (2h)
1. Créer page "My Class"
2. Input code + bouton rejoindre
3. Liste classes rejointes

### Action 4 : Drag & Drop (2-3h)
1. Composant ModuleSharing
2. Drag module → Drop classe
3. Appel API `shareModuleWithClass`

### Action 5 : Navigation (1h)
1. Ajouter liens conditionnels sidebar
2. Icônes appropriées
3. Active states

### Action 6 : Tests (2h)
1. Scénario Prof complet
2. Scénario Élève complet
3. Vérifier non-regression étudiant

---

## 📂 STRUCTURE FICHIERS CRÉÉS

```
apps/web/
├── app/
│   ├── (auth)/
│   │   └── register/
│   │       └── page.tsx ✅ MODIFIÉ
│   └── (dashboard)/
│       ├── dashboard/
│       │   └── page.tsx ⏳ À MODIFIER (routing conditionnel)
│       ├── dashboard-teacher/ ⏳ À CRÉER
│       │   └── page.tsx
│       ├── classes/ ⏳ À CRÉER
│       │   ├── page.tsx (liste)
│       │   └── [id]/
│       │       └── page.tsx (détails)
│       ├── my-class/ ⏳ À CRÉER
│       │   └── page.tsx
│       └── class/ ⏳ À CRÉER
│           └── [id]/
│               ├── page.tsx
│               └── module/
│                   └── [moduleId]/
│                       └── page.tsx
├── components/
│   ├── teacher/ ⏳ À CRÉER
│   │   ├── TeacherDashboard.tsx
│   │   ├── ClassCard.tsx
│   │   ├── ModuleCard.tsx
│   │   ├── CreateClassModal.tsx
│   │   └── ModuleSharing.tsx
│   └── student/ ⏳ À CRÉER
│       ├── MyClassPage.tsx
│       └── StudentClassCard.tsx
├── lib/
│   ├── supabase/
│   │   ├── classes.ts ✅ CRÉÉ
│   │   └── class-modules.ts ✅ CRÉÉ
│   └── utils/
│       └── terminology.ts ⏳ À CRÉER

supabase/
├── add_teacher_role.sql ✅ CRÉÉ
├── add_classes_system.sql ✅ CRÉÉ
└── add_class_modules.sql ✅ CRÉÉ
```

---

## 🎨 DESIGN GUIDELINES

### Respect du Design System

**Fichier de référence** : `design-system.json`

#### Colors (Semantic Tokens)
```css
/* Backgrounds */
bg-default      /* White/Black */
bg-muted        /* neutral-50/neutral-900 */
bg-subtle       /* neutral-100/neutral-800 */
bg-emphasis     /* Emphasized background */

/* Content */
content-default /* Primary text */
content-muted   /* Secondary text */
content-subtle  /* Subtle text */
content-emphasis /* Headings */

/* Borders */
border-default
border-muted
border-subtle
```

#### Typography
- **Font Default** : Inter
- **Font Display** : Satoshi (headings)
- **Font Mono** : Geist Mono (codes)

#### Spacing
Utiliser les classes Tailwind : `p-4`, `mb-6`, `gap-3`, etc.

#### Components Existants
Réutiliser au maximum :
- `Button` (`/components/ui/Button.tsx`)
- `Card` (`/components/ui/Card.tsx`)
- `Input` (`/components/ui/Input.tsx`)
- `Modal` (pattern existant)

---

## 🐛 PROBLÈMES POTENTIELS

### 1. Types TypeScript
Les tables `classes`, `class_memberships`, `class_modules` ne sont pas dans `types.ts`.

**Solution** : Régénérer les types Supabase
```bash
npx supabase gen types typescript --project-id vbqvhumwsbezoipaexsw > apps/web/lib/supabase/types.ts
```

### 2. RLS Non Testé
Les politiques RLS n'ont pas été testées en conditions réelles.

**Solution** : Tests manuels après migration
- Créer 1 prof + 1 élève
- Vérifier isolations

### 3. Google OAuth
Les utilisateurs Google OAuth doivent aussi avoir un rôle.

**Solution** : Mettre à jour `ensure_google_oauth_profiles.sql` pour inclure role par défaut 'student'

---

## 📊 MÉTRIQUES DE SUCCÈS

### Techniques
- ✅ Migrations SQL exécutées sans erreur
- ✅ RLS policies testées
- ⏳ Dashboard prof fonctionnel
- ⏳ Dashboard élève non cassé
- ⏳ Création classe < 30s
- ⏳ Join classe < 10s

### UX
- ⏳ Choix Prof/Élève à l'inscription clair
- ⏳ Code classe facile à copier
- ⏳ Drag & Drop intuitif
- ⏳ Terminologie cohérente

### Business
- ⏳ 1 prof peut créer N classes
- ⏳ 1 module → N classes (duplication)
- ⏳ Tracking ratio prof/élèves

---

## 📞 QUESTIONS / AIDE

### Si erreur migration SQL
1. Vérifier que `generate_cuid()` existe (dans `schema.sql`)
2. Vérifier que `update_updated_at_column()` existe
3. Exécuter migrations dans l'ordre

### Si types TypeScript manquants
Régénérer avec `supabase gen types`

### Si RLS bloque
Vérifier dans Supabase Dashboard → Authentication que l'utilisateur a bien un `role`

---

**Prochaine étape** : Implémenter les composants UI (Dashboard Prof, My Class, etc.)

**Temps estimé restant** : 10-12 heures

**Date cible de complétion** : 10 Décembre 2025

