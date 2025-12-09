-- ============================================
-- FIX ULTRA-SIMPLE : RLS sans aucune complexité
-- ============================================

-- Désactiver temporairement
ALTER TABLE public.classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_memberships DISABLE ROW LEVEL SECURITY;

-- ============================================
-- Nettoyer TOUT
-- ============================================
DO $$ 
DECLARE 
  policy_name TEXT;
BEGIN
  -- Drop classes policies
  FOR policy_name IN 
    SELECT policyname FROM pg_policies 
    WHERE tablename = 'classes' AND schemaname = 'public'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || policy_name || '" ON public.classes';
  END LOOP;
  
  -- Drop class_memberships policies
  FOR policy_name IN 
    SELECT policyname FROM pg_policies 
    WHERE tablename = 'class_memberships' AND schemaname = 'public'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || policy_name || '" ON public.class_memberships';
  END LOOP;
END $$;

-- Drop RPC functions
DROP FUNCTION IF EXISTS get_class_by_id(UUID);
DROP FUNCTION IF EXISTS get_class_members(UUID);

-- ============================================
-- CLASSES : Policy ULTRA-SIMPLE (teacher only for now)
-- ============================================

-- Teachers: full access to their classes
CREATE POLICY "classes_teacher_access"
  ON public.classes
  FOR ALL
  TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

-- ============================================
-- CLASS_MEMBERSHIPS : Policy ULTRA-SIMPLE
-- ============================================

-- Students: access to their own memberships
CREATE POLICY "memberships_student_access"
  ON public.class_memberships
  FOR ALL
  TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- Teachers: access to memberships where they own the class
-- CRITICAL: Use a LEFT JOIN to avoid recursion
CREATE POLICY "memberships_teacher_access"
  ON public.class_memberships
  FOR ALL
  TO authenticated
  USING (
    -- Only check if class exists with current user as teacher
    -- This won't trigger RLS on classes because we're just checking teacher_id
    class_id IN (
      SELECT id FROM public.classes WHERE teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    class_id IN (
      SELECT id FROM public.classes WHERE teacher_id = auth.uid()
    )
  );

-- ============================================
-- Enable RLS
-- ============================================
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_memberships ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Success
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Ultra-simple RLS policies created';
  RAISE NOTICE '✅ Classes: 1 policy (teacher only)';
  RAISE NOTICE '✅ Memberships: 2 policies';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Note: Students cannot view classes for now (will fix after testing)';
END $$;

