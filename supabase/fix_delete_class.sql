-- ============================================
-- Fix: Delete class with RPC (bypass RLS recursion)
-- ============================================

-- 1. Create safe delete function
CREATE OR REPLACE FUNCTION delete_class_safe(
  p_class_id UUID,
  p_teacher_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_teacher_id UUID;
BEGIN
  -- Verify the class belongs to this teacher
  SELECT teacher_id INTO v_teacher_id
  FROM public.classes
  WHERE id = p_class_id;
  
  IF v_teacher_id IS NULL THEN
    RAISE EXCEPTION 'Class not found';
  END IF;
  
  IF v_teacher_id != p_teacher_id THEN
    RAISE EXCEPTION 'You do not own this class';
  END IF;
  
  -- Delete the class (cascades will handle memberships and modules)
  DELETE FROM public.classes WHERE id = p_class_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Grant permission
GRANT EXECUTE ON FUNCTION delete_class_safe(UUID, UUID) TO authenticated;

-- 3. Also fix the RLS policies (disable recursion completely for DELETE)
DROP POLICY IF EXISTS "Teachers can delete their classes" ON public.classes;

-- Recreate without recursion - just check direct ownership
CREATE POLICY "Teachers can delete their classes"
  ON public.classes FOR DELETE
  USING (teacher_id = auth.uid());

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Function delete_class_safe created';
  RAISE NOTICE '✅ RLS DELETE policy recreated without recursion';
END $$;

