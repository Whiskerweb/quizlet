# 🔄 ORDRE D'EXÉCUTION DES MIGRATIONS SQL

**Important** : Les migrations doivent être exécutées **dans cet ordre précis** pour éviter les erreurs de dépendances.

---

## ✅ ORDRE CORRECT D'EXÉCUTION

### 1️⃣ Schema de base (SI PAS DÉJÀ FAIT)
**Fichier** : `supabase/schema.sql`

**Description** : Crée les tables de base (profiles, sets, flashcards, etc.)

**Vérifier si déjà exécuté** :
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'sets', 'flashcards');
```

Si ces tables existent, passez à l'étape suivante.

---

### 2️⃣ Système de dossiers (PRÉREQUIS IMPORTANT)
**Fichier** : `supabase/add_folders.sql`

**Description** : Crée la table `folders` (nécessaire pour class_modules)

**Exécuter** :
```sql
-- Copiez-collez le contenu de add_folders.sql
```

**Vérifier** :
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'folders';
```

---

### 3️⃣ Rôle utilisateur (Prof/Élève)
**Fichier** : `supabase/add_teacher_role.sql`

**Description** : Ajoute la colonne `role` à la table `profiles`

**Exécuter** :
```sql
-- Copiez-collez le contenu de add_teacher_role.sql
```

**Vérifier** :
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'role';
```

---

### 4️⃣ Système de classes
**Fichier** : `supabase/add_classes_system.sql` ⚠️ **VERSION CORRIGÉE**

**Description** : Crée les tables `classes` et `class_memberships`

**Exécuter** :
```sql
-- Copiez-collez le contenu de add_classes_system.sql (version corrigée)
```

**Vérifier** :
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('classes', 'class_memberships');
```

---

### 5️⃣ Modules de classe
**Fichier** : `supabase/add_class_modules.sql`

**Description** : Crée la table `class_modules` (lie folders aux classes)

⚠️ **PRÉREQUIS** :
- Table `folders` doit exister (étape 2)
- Table `classes` doit exister (étape 4)

**Exécuter** :
```sql
-- Copiez-collez le contenu de add_class_modules.sql
```

**Vérifier** :
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'class_modules';
```

---

## 🔧 EN CAS D'ERREUR

### Erreur 1 : "column module_id does not exist"

**Cause** : La table `folders` n'existe pas.

**Solution** :
1. Vérifier si `folders` existe :
```sql
SELECT * FROM public.folders LIMIT 1;
```

2. Si erreur, exécuter `add_folders.sql` d'abord
3. Puis ré-exécuter `add_class_modules.sql`

---

### Erreur 2 : "cannot use subquery in check constraint"

**Cause** : PostgreSQL n'autorise pas les subqueries dans les CHECK constraints.

**Solution** : Utiliser la version corrigée de `add_classes_system.sql` (contraintes CHECK supprimées).

---

### Erreur 3 : "relation does not exist"

**Cause** : Une table dépendante n'a pas été créée.

**Solution** : Vérifier l'ordre d'exécution ci-dessus.

---

## 📝 SCRIPT DE VÉRIFICATION COMPLET

Copiez-collez ce script dans Supabase SQL Editor pour vérifier toutes les tables :

```sql
-- ============================================
-- Script de vérification des tables
-- ============================================

DO $$
DECLARE
  tables_check TEXT[];
  table_name TEXT;
  exists_check BOOLEAN;
BEGIN
  tables_check := ARRAY[
    'profiles',
    'sets',
    'flashcards',
    'folders',
    'classes',
    'class_memberships',
    'class_modules'
  ];
  
  RAISE NOTICE '=== VÉRIFICATION DES TABLES ===';
  
  FOREACH table_name IN ARRAY tables_check
  LOOP
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = table_name
    ) INTO exists_check;
    
    IF exists_check THEN
      RAISE NOTICE '✅ Table "%" existe', table_name;
    ELSE
      RAISE NOTICE '❌ Table "%" manquante', table_name;
    END IF;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '=== VÉRIFICATION DE LA COLONNE ROLE ===';
  
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'role'
  ) INTO exists_check;
  
  IF exists_check THEN
    RAISE NOTICE '✅ Colonne "role" existe dans profiles';
  ELSE
    RAISE NOTICE '❌ Colonne "role" manquante dans profiles';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '=== VÉRIFICATION DES FONCTIONS ===';
  
  SELECT EXISTS (
    SELECT FROM pg_proc 
    WHERE proname = 'get_class_stats'
  ) INTO exists_check;
  
  IF exists_check THEN
    RAISE NOTICE '✅ Fonction "get_class_stats" existe';
  ELSE
    RAISE NOTICE '❌ Fonction "get_class_stats" manquante';
  END IF;
  
  SELECT EXISTS (
    SELECT FROM pg_proc 
    WHERE proname = 'join_class_by_code'
  ) INTO exists_check;
  
  IF exists_check THEN
    RAISE NOTICE '✅ Fonction "join_class_by_code" existe';
  ELSE
    RAISE NOTICE '❌ Fonction "join_class_by_code" manquante';
  END IF;
  
END $$;
```

---

## 🎯 RÉSUMÉ ORDRE D'EXÉCUTION

```
1. schema.sql            (si pas déjà fait)
2. add_folders.sql       ⚠️ IMPORTANT - Prérequis pour étape 5
3. add_teacher_role.sql  (corrigé - sans CHECK constraints)
4. add_classes_system.sql (corrigé - sans CHECK constraints)
5. add_class_modules.sql (nécessite folders + classes)
```

---

## 💡 CONSEIL

Pour éviter les erreurs, copiez-collez ce script qui exécute tout dans l'ordre :

```sql
-- ⚠️ ATTENTION : À n'utiliser que si vous partez de zéro !
-- Si certaines tables existent déjà, exécutez les migrations individuellement.

-- 1. Vérifier que folders existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'folders') THEN
    RAISE EXCEPTION 'Table folders manquante. Exécutez add_folders.sql d''abord !';
  END IF;
END $$;

-- 2. Puis exécuter add_teacher_role.sql
-- 3. Puis exécuter add_classes_system.sql
-- 4. Puis exécuter add_class_modules.sql
```

---

**Prochaine étape** : Après avoir exécuté toutes les migrations avec succès, régénérer les types TypeScript :

```bash
npx supabase gen types typescript --project-id vbqvhumwsbezoipaexsw > apps/web/lib/supabase/types.ts
```

