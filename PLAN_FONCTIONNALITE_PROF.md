# 🎓 PLAN D'IMPLÉMENTATION - FONCTIONNALITÉ PROFESSEUR

**Date** : 8 Décembre 2025  
**Objectif** : Ajouter un espace Professeur pour partager des modules avec des classes d'élèves  
**Impact Marketing** : 1 prof = plusieurs classes de 30 élèves = acquisition massive

---

## 📋 Vision Produit

### Problématique
Actuellement, CARDZ est uniquement destiné aux étudiants. Les professeurs ne peuvent pas créer de contenu pour leurs classes ni suivre leurs élèves.

### Solution
Créer un système **Professeur** permettant de :
- Créer des **modules** (équivalent des dossiers mais pour profs)
- Créer des **classes** avec codes d'accès uniques
- **Dupliquer** des modules vers les classes pour partage
- Garder l'expérience **étudiant** intacte

### Bénéfices
- **Prof** : Créer une fois, partager plusieurs fois
- **Élèves** : Accéder au contenu de leurs profs via code classe
- **Plateforme** : Acquisition exponentielle (1 prof × 30 élèves × N classes)

---

## 🗄️ Architecture Base de Données

### Tables Existantes Utilisées

#### ✅ `profiles` (à modifier)
```sql
-- Ajouter colonne 'role'
ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'student' CHECK (role IN ('student', 'teacher'));
```

#### ✅ `sets` (cardz)
Reste inchangé, utilisé par profs et élèves.

#### ✅ `folders` (à renommer conceptuellement)
Pour les profs : appelé "Modules" dans l'UI  
Pour les élèves : reste "Dossiers"

### Nouvelles Tables à Créer

#### 🆕 `classes`
```sql
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  class_code TEXT UNIQUE NOT NULL DEFAULT generate_cuid(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 🆕 `class_memberships`
```sql
CREATE TABLE public.class_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(class_id, student_id)
);
```

#### 🆕 `class_modules`
```sql
CREATE TABLE public.class_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
  -- Duplicated module data
  duplicated_sets JSONB, -- Store duplicated set IDs
  shared_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(class_id, module_id)
);
```

---

## 🎯 ÉTAPE 1 : Différenciation Inscription (Prof/Élève)

### 1.1 Base de Données

**Fichier** : `supabase/add_teacher_role.sql`

```sql
-- Add role column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student' 
CHECK (role IN ('student', 'teacher'));

-- Create index
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Update existing users to 'student' by default
UPDATE public.profiles SET role = 'student' WHERE role IS NULL;

-- Update handle_new_user trigger to include role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter INTEGER := 0;
  user_role TEXT;
BEGIN
  -- Get username and role from metadata
  base_username := COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8));
  final_username := base_username;
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
  
  -- Handle username conflicts
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := base_username || '_' || counter;
  END LOOP;
  
  -- Insert profile with role
  INSERT INTO public.profiles (id, email, username, role)
  VALUES (NEW.id, NEW.email, final_username, user_role)
  ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 1.2 Frontend - Page Register

**Fichier** : `apps/web/app/(auth)/register/page.tsx`

Modifications :
1. Ajouter state `role` : `'student' | 'teacher' | null`
2. Ajouter composant de choix (2 boutons stylisés)
3. Bloquer soumission si `role === null`
4. Passer `role` dans metadata Supabase

**UI Proposée** :
```tsx
// Avant le formulaire
<div className="mb-6">
  <p className="text-sm text-content-muted mb-3">Je suis :</p>
  <div className="grid grid-cols-2 gap-3">
    <button
      type="button"
      onClick={() => setRole('student')}
      className={cn(
        "p-4 rounded-lg border-2 transition-all",
        role === 'student' 
          ? "border-brand-primary bg-blue-50" 
          : "border-border-subtle hover:border-border-emphasis"
      )}
    >
      <GraduationCap className="h-8 w-8 mx-auto mb-2" />
      <span className="font-medium">Élève</span>
    </button>
    <button
      type="button"
      onClick={() => setRole('teacher')}
      className={cn(
        "p-4 rounded-lg border-2 transition-all",
        role === 'teacher' 
          ? "border-brand-primary bg-blue-50" 
          : "border-border-subtle hover:border-border-emphasis"
      )}
    >
      <BookOpen className="h-8 w-8 mx-auto mb-2" />
      <span className="font-medium">Professeur</span>
    </button>
  </div>
</div>
```

### 1.3 Validation

- Message d'erreur si soumission sans choix : "Veuillez sélectionner votre profil"
- Store `role` dans Supabase `auth.users.raw_user_meta_data`
- Récupérer `role` dans `profiles` table

---

## 🎯 ÉTAPE 2 : Dashboard Prof avec Modules

### 2.1 Base de Données

**Aucune modification nécessaire** - On réutilise `folders` table.

**Terminologie UI** :
- **Professeur** : "Modules"
- **Élève** : "Dossiers"

### 2.2 Composants UI

**Nouveau composant** : `apps/web/app/(dashboard)/dashboard-teacher/page.tsx`

**Routing conditionnel** :
```tsx
// apps/web/app/(dashboard)/dashboard/page.tsx
export default function DashboardPage() {
  const { profile } = useAuthStore();
  
  if (profile?.role === 'teacher') {
    return <TeacherDashboard />;
  }
  
  return <StudentDashboard />;
}
```

**Dashboard Prof** :
```tsx
// Structure similaire au dashboard étudiant
<TeacherDashboard>
  <Header>
    <h1>Bonjour {profile.username}</h1>
    <Button>Créer un module</Button>
  </Header>
  
  <Insights />
  
  <ModulesSection>
    {modules.map(module => (
      <ModuleCard key={module.id} module={module}>
        {/* Afficher les cardz du module */}
      </ModuleCard>
    ))}
  </ModulesSection>
  
  <ClassesSection>
    {classes.map(cls => (
      <ClassCard key={cls.id} class={cls}>
        {/* Afficher code, nb élèves */}
      </ClassCard>
    ))}
  </ClassesSection>
</TeacherDashboard>
```

### 2.3 Services API

**Fichier** : `apps/web/lib/supabase/modules.ts`

```typescript
// Wrapper autour de foldersService avec terminologie "module"
export const modulesService = {
  async getMyModules() {
    const data = await foldersService.getWithSets();
    return {
      modules: data.folders, // Renommer pour clarté
      setsWithoutModule: data.setsWithoutFolder
    };
  },
  
  async createModule(name: string) {
    return foldersService.create({ name });
  },
  
  // ... autres méthodes
};
```

---

## 🎯 ÉTAPE 3 : Création de Classes avec Codes

### 3.1 Base de Données

**Fichier** : `supabase/add_classes_system.sql`

```sql
-- Table classes
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  class_code TEXT UNIQUE NOT NULL DEFAULT generate_cuid(),
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cover_image TEXT,
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table class_memberships
CREATE TABLE IF NOT EXISTS public.class_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(class_id, student_id),
  CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = student_id AND role = 'student'
    )
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON public.classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_code ON public.classes(class_code);
CREATE INDEX IF NOT EXISTS idx_class_memberships_class_id ON public.class_memberships(class_id);
CREATE INDEX IF NOT EXISTS idx_class_memberships_student_id ON public.class_memberships(student_id);

-- Triggers
CREATE TRIGGER update_classes_updated_at 
  BEFORE UPDATE ON public.classes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_memberships ENABLE ROW LEVEL SECURITY;

-- Teachers can manage their own classes
CREATE POLICY "Teachers can view their own classes"
  ON public.classes FOR SELECT
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can create classes"
  ON public.classes FOR INSERT
  WITH CHECK (
    auth.uid() = teacher_id 
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher')
  );

CREATE POLICY "Teachers can update their classes"
  ON public.classes FOR UPDATE
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete their classes"
  ON public.classes FOR DELETE
  USING (auth.uid() = teacher_id);

-- Students can view classes they're members of
CREATE POLICY "Students can view their classes"
  ON public.classes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.class_memberships
      WHERE class_memberships.class_id = classes.id
      AND class_memberships.student_id = auth.uid()
    )
  );

-- Memberships policies
CREATE POLICY "Users can view their own memberships"
  ON public.class_memberships FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view their class memberships"
  ON public.class_memberships FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE classes.id = class_memberships.class_id
      AND classes.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can join classes"
  ON public.class_memberships FOR INSERT
  WITH CHECK (
    auth.uid() = student_id 
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'student')
  );

CREATE POLICY "Students can leave classes"
  ON public.class_memberships FOR DELETE
  USING (auth.uid() = student_id);

-- Function to get class stats
CREATE OR REPLACE FUNCTION get_class_stats(class_uuid UUID)
RETURNS TABLE (
  student_count INTEGER,
  module_count INTEGER,
  total_sets INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::INTEGER FROM class_memberships WHERE class_id = class_uuid),
    (SELECT COUNT(*)::INTEGER FROM class_modules WHERE class_id = class_uuid),
    (SELECT COUNT(DISTINCT set_id)::INTEGER 
     FROM class_modules cm
     JOIN folders f ON cm.module_id = f.id
     JOIN sets s ON s.folder_id = f.id
     WHERE cm.class_id = class_uuid);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
```

### 3.2 UI Gestion Classes (Prof)

**Composant** : `apps/web/components/teacher/ClassManagement.tsx`

```tsx
export function ClassManagement() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Mes Classes</h2>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Créer une classe
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {classes.map(cls => (
          <ClassCard key={cls.id} class={cls} />
        ))}
      </div>
      
      <CreateClassModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}

function ClassCard({ class: cls }: { class: Class }) {
  const [showCode, setShowCode] = useState(false);
  const stats = useClassStats(cls.id);
  
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-lg">{cls.name}</h3>
          <p className="text-sm text-content-muted">{cls.description}</p>
        </div>
        <Badge color={cls.color}>{stats.studentCount} élèves</Badge>
      </div>
      
      <div className="space-y-2 text-sm text-content-muted">
        <div>📚 {stats.moduleCount} modules partagés</div>
        <div>🎴 {stats.totalSets} sets</div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-border-subtle">
        <button
          onClick={() => setShowCode(!showCode)}
          className="text-sm text-brand-primary hover:underline"
        >
          {showCode ? 'Masquer' : 'Afficher'} le code
        </button>
        {showCode && (
          <div className="mt-2 p-2 bg-bg-subtle rounded font-mono text-lg">
            {cls.classCode}
          </div>
        )}
      </div>
    </Card>
  );
}
```

### 3.3 Onglet "My Class" (Élèves)

**Composant** : `apps/web/app/(dashboard)/my-class/page.tsx`

```tsx
export default function MyClassPage() {
  const [myClasses, setMyClasses] = useState<Class[]>([]);
  const [joinCode, setJoinCode] = useState('');
  
  const handleJoinClass = async () => {
    try {
      await classesService.joinClass(joinCode);
      // Reload classes
      loadClasses();
      setJoinCode('');
    } catch (error) {
      alert('Code invalide ou classe inexistante');
    }
  };
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Mes Classes</h1>
      
      {/* Join Class Section */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Rejoindre une classe</h2>
        <div className="flex gap-3">
          <Input
            placeholder="Entrez le code de classe"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            className="font-mono"
          />
          <Button onClick={handleJoinClass}>
            Rejoindre
          </Button>
        </div>
      </Card>
      
      {/* My Classes List */}
      <div className="grid gap-4 md:grid-cols-2">
        {myClasses.map(cls => (
          <StudentClassCard key={cls.id} class={cls} />
        ))}
      </div>
    </div>
  );
}

function StudentClassCard({ class: cls }: { class: Class }) {
  const modules = useClassModules(cls.id);
  
  return (
    <Card className="p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold">{cls.name}</h3>
          <p className="text-sm text-content-muted">
            Prof. {cls.teacher.username}
          </p>
        </div>
      </div>
      
      <div className="space-y-2">
        <p className="text-sm font-medium">Modules disponibles :</p>
        {modules.map(module => (
          <Link 
            key={module.id}
            href={`/class/${cls.id}/module/${module.id}`}
            className="block p-2 rounded hover:bg-bg-subtle"
          >
            📁 {module.name} ({module.setsCount} sets)
          </Link>
        ))}
      </div>
    </Card>
  );
}
```

---

## 🎯 ÉTAPE 4 : Partage Modules vers Classes

### 4.1 Base de Données

**Fichier** : `supabase/add_class_modules.sql`

```sql
-- Table class_modules
CREATE TABLE IF NOT EXISTS public.class_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.folders(id) ON DELETE CASCADE,
  shared_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(class_id, module_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_class_modules_class_id ON public.class_modules(class_id);
CREATE INDEX IF NOT EXISTS idx_class_modules_module_id ON public.class_modules(module_id);

-- RLS
ALTER TABLE public.class_modules ENABLE ROW LEVEL SECURITY;

-- Teachers can manage modules in their classes
CREATE POLICY "Teachers can view modules in their classes"
  ON public.class_modules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE classes.id = class_modules.class_id
      AND classes.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can add modules to their classes"
  ON public.class_modules FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE classes.id = class_modules.class_id
      AND classes.teacher_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.folders
      WHERE folders.id = class_modules.module_id
      AND folders.user_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can remove modules from their classes"
  ON public.class_modules FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE classes.id = class_modules.class_id
      AND classes.teacher_id = auth.uid()
    )
  );

-- Students can view modules in their classes
CREATE POLICY "Students can view modules in their classes"
  ON public.class_modules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.class_memberships
      WHERE class_memberships.class_id = class_modules.class_id
      AND class_memberships.student_id = auth.uid()
    )
  );

-- Function to share module with class
CREATE OR REPLACE FUNCTION share_module_with_class(
  p_module_id UUID,
  p_class_id UUID
)
RETURNS void AS $$
BEGIN
  -- Insert module into class
  INSERT INTO public.class_modules (class_id, module_id)
  VALUES (p_class_id, p_module_id)
  ON CONFLICT (class_id, module_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4.2 UI Drag & Drop

**Composant** : `apps/web/components/teacher/ModuleSharing.tsx`

```tsx
export function ModuleSharing() {
  const [draggedModule, setDraggedModule] = useState<string | null>(null);
  
  const handleDragStart = (moduleId: string) => {
    setDraggedModule(moduleId);
  };
  
  const handleDrop = async (classId: string) => {
    if (!draggedModule) return;
    
    try {
      await classModulesService.shareModule(draggedModule, classId);
      alert('Module partagé avec succès !');
    } catch (error) {
      alert('Erreur lors du partage');
    }
    
    setDraggedModule(null);
  };
  
  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Left: Modules */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Mes Modules</h2>
        {modules.map(module => (
          <div
            key={module.id}
            draggable
            onDragStart={() => handleDragStart(module.id)}
            className="p-3 mb-2 bg-white border rounded cursor-move hover:shadow"
          >
            📁 {module.name}
          </div>
        ))}
      </div>
      
      {/* Right: Classes */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Mes Classes</h2>
        {classes.map(cls => (
          <div
            key={cls.id}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(cls.id)}
            className="p-4 mb-2 bg-blue-50 border-2 border-dashed rounded"
          >
            <h3 className="font-medium">{cls.name}</h3>
            <p className="text-sm text-content-muted mt-2">
              {cls.sharedModules.length} module(s) partagé(s)
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 4.3 Logique de Duplication

**Important** : Les modules sont **dupliqués**, pas déplacés.

```typescript
// apps/web/lib/supabase/class-modules.ts
export const classModulesService = {
  async shareModule(moduleId: string, classId: string) {
    // 1. Vérifier que le prof possède le module
    const module = await modulesService.getById(moduleId);
    if (!module) throw new Error('Module not found');
    
    // 2. Ajouter l'association class_modules
    const { error } = await supabase
      .from('class_modules')
      .insert({ class_id: classId, module_id: moduleId });
    
    if (error) throw error;
    
    // Note: Les sets restent dans le module original
    // Les étudiants y accèdent via la relation class_modules
  },
  
  async getClassModules(classId: string) {
    const { data, error } = await supabase
      .from('class_modules')
      .select(`
        *,
        module:folders(
          *,
          sets(*)
        ),
        class:classes(*)
      `)
      .eq('class_id', classId);
    
    if (error) throw error;
    return data;
  }
};
```

---

## 🎯 ÉTAPE 5 : UX/UI et Audit Final

### 5.1 Design System

**Respect strict du design-system.json** :

1. **Colors** : Utiliser semantic tokens
   - `bg-default`, `bg-muted`, `bg-emphasis`
   - `content-default`, `content-muted`
   - `border-subtle`

2. **Typography** : 
   - Inter (default)
   - Satoshi (display/headers)

3. **Spacing** : Suivre la grille Tailwind

4. **Components** : Réutiliser composants existants
   - `Button`, `Card`, `Input`, `Modal`
   - Pas de nouveaux composants si possible

5. **Animations** : 
   - `fade-in`, `slide-up-fade`
   - Durées : 200ms, 400ms

### 5.2 Checklist Non-Breaking Changes

- [ ] Dashboard étudiant fonctionne exactement pareil
- [ ] Aucun composant existant n'est cassé
- [ ] RLS garantit isolation prof/élève
- [ ] Performance identique ou meilleure
- [ ] Mobile-responsive (toutes les vues)
- [ ] Accessibilité (ARIA labels)

### 5.3 Tests Complets

#### Scénario Prof
1. Inscription en tant que prof
2. Créer 3 modules avec 5 cardz chacun
3. Créer 2 classes
4. Partager modules vers classes
5. Vérifier codes classes

#### Scénario Élève
1. Inscription en tant qu'élève
2. Rejoindre classe avec code
3. Voir modules partagés
4. Étudier un set de la classe
5. Vérifier stats

#### Scénario Mixte
1. 1 prof + 3 élèves
2. Prof crée classe et partage contenu
3. Élèves rejoignent et étudient
4. Prof voit statistiques classe (future)

---

## 📊 Métriques de Succès

### Techniques
- [ ] 0 breaking change dashboard étudiant
- [ ] < 500ms temps chargement dashboard prof
- [ ] 100% coverage RLS
- [ ] Mobile-responsive (100% fonctionnel)

### Produit
- [ ] Inscription prof fluide (< 30s)
- [ ] Création classe intuitive
- [ ] Partage module en 2 clics
- [ ] Join classe élève en 10s

### Business
- [ ] 1 prof peut gérer N classes
- [ ] 1 module → N classes (duplication)
- [ ] Tracking : ratio prof/élèves

---

## 🚀 Ordre d'Implémentation

### Phase 1 (2-3h)
1. ✅ Migration SQL : `role` dans profiles
2. ✅ Page Register : Choix Prof/Élève
3. ✅ Test inscription

### Phase 2 (3-4h)
4. ✅ Dashboard Prof (composant)
5. ✅ Terminologie "Modules"
6. ✅ Services API modules

### Phase 3 (4-5h)
7. ✅ Migration SQL : tables classes
8. ✅ UI Gestion classes (prof)
9. ✅ UI My Class (élève)
10. ✅ Join classe avec code

### Phase 4 (3-4h)
11. ✅ Migration SQL : class_modules
12. ✅ Drag & Drop modules→classes
13. ✅ Affichage modules dans classes

### Phase 5 (2-3h)
14. ✅ Audit UX/UI
15. ✅ Tests complets
16. ✅ Documentation

**Total estimé** : **14-19 heures**

---

## 📝 Notes Importantes

### ⚠️ Points d'Attention

1. **Ne PAS supprimer `folders`** - On le réutilise
2. **Duplication, pas déplacement** - Sets restent chez le prof
3. **RLS critique** - Isoler prof/élève
4. **Mobile-first** - Design responsive obligatoire
5. **Design system** - Respect strict

### 🔮 Futures Améliorations (Hors Scope)

- Statistiques classe (progression élèves)
- Devoirs/assignments
- Notifications push
- Chat prof-élèves
- Export résultats
- Badges/gamification classe

---

**Document créé le** : 8 Décembre 2025  
**Version** : 1.0  
**Status** : 📝 Planification → 🚧 Implémentation


