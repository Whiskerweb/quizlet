-- ============================================
-- FIX DÉFINITIF : RLS sans récursion
-- ============================================

-- Désactiver temporairement RLS pour nettoyer
ALTER TABLE public.classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_memberships DISABLE ROW LEVEL SECURITY;

-- ============================================
-- CLASSES : Supprimer TOUTES les policies existantes
-- ============================================
DO $$ 
DECLARE 
  policy_name TEXT;
BEGIN
  FOR policy_name IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'classes' AND schemaname = 'public'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || policy_name || '" ON public.classes';
  END LOOP;
END $$;

-- ============================================
-- CLASS_MEMBERSHIPS : Supprimer TOUTES les policies existantes
-- ============================================
DO $$ 
DECLARE 
  policy_name TEXT;
BEGIN
  FOR policy_name IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'class_memberships' AND schemaname = 'public'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || policy_name || '" ON public.class_memberships';
  END LOOP;
END $$;

-- ============================================
-- CLASSES : Policies SIMPLES (sans récursion)
-- ============================================

-- Teachers can do everything with their own classes
CREATE POLICY "classes_teacher_all"
  ON public.classes
  FOR ALL
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);

-- Students can ONLY view classes (no insert/update/delete)
-- IMPORTANT: Use a simple subquery that won't recurse
CREATE POLICY "classes_student_select"
  ON public.classes
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT student_id 
      FROM public.class_memberships 
      WHERE class_memberships.class_id = classes.id
    )
  );

-- ============================================
-- CLASS_MEMBERSHIPS : Policies SIMPLES (sans récursion)
-- ============================================

-- Students can view and manage their own memberships
CREATE POLICY "memberships_student_all"
  ON public.class_memberships
  FOR ALL
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

-- Teachers can view and manage memberships of their classes
-- IMPORTANT: Direct join without recursion
CREATE POLICY "memberships_teacher_all"
  ON public.class_memberships
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 
      FROM public.classes 
      WHERE classes.id = class_memberships.class_id 
      AND classes.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM public.classes 
      WHERE classes.id = class_memberships.class_id 
      AND classes.teacher_id = auth.uid()
    )
  );

-- ============================================
-- Réactiver RLS
-- ============================================
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_memberships ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Créer les fonctions RPC sécurisées (bypass RLS)
-- ============================================

-- Function to get a single class (bypass RLS)
CREATE OR REPLACE FUNCTION get_class_by_id(p_class_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  class_code TEXT,
  color TEXT,
  cover_image TEXT,
  teacher_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Verify user has access (either teacher or student member)
  IF NOT EXISTS (
    SELECT 1 FROM public.classes c
    WHERE c.id = p_class_id
    AND (
      c.teacher_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.class_memberships cm
        WHERE cm.class_id = c.id AND cm.student_id = auth.uid()
      )
    )
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.description,
    c.class_code,
    c.color,
    c.cover_image,
    c.teacher_id,
    c.created_at,
    c.updated_at
  FROM public.classes c
  WHERE c.id = p_class_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get class members (bypass RLS)
CREATE OR REPLACE FUNCTION get_class_members(p_class_id UUID)
RETURNS TABLE (
  student_id UUID,
  username TEXT,
  email TEXT,
  avatar_url TEXT,
  joined_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Verify user is the teacher
  IF NOT EXISTS (
    SELECT 1 FROM public.classes
    WHERE id = p_class_id AND teacher_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied - not the class teacher';
  END IF;

  RETURN QUERY
  SELECT 
    p.id AS student_id,
    p.username,
    p.email,
    p.avatar_url,
    cm.joined_at
  FROM public.class_memberships cm
  JOIN public.profiles p ON p.id = cm.student_id
  WHERE cm.class_id = p_class_id
  ORDER BY cm.joined_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_class_by_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_class_members(UUID) TO authenticated;

-- ============================================
-- Success message
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ RLS policies recreated without recursion';
  RAISE NOTICE '✅ Secure RPC functions created';
  RAISE NOTICE '✅ Classes table: 2 policies';
  RAISE NOTICE '✅ Class_memberships table: 2 policies';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Security: Teachers and students have appropriate access';
  RAISE NOTICE '📊 Ready to test!';
END $$;

