-- ============================================
-- FIX: Fonction join_class_by_code
-- ============================================

-- Drop and recreate the function to ensure it's correct
DROP FUNCTION IF EXISTS join_class_by_code(TEXT, UUID);

CREATE OR REPLACE FUNCTION join_class_by_code(
  p_class_code TEXT,
  p_student_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_class_id UUID;
  v_student_role TEXT;
  v_already_member BOOLEAN;
BEGIN
  -- Check if user is a student
  SELECT role INTO v_student_role
  FROM public.profiles
  WHERE id = p_student_id;
  
  IF v_student_role IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  IF v_student_role != 'student' THEN
    RAISE EXCEPTION 'Only students can join classes';
  END IF;
  
  -- Find class by code (case insensitive)
  SELECT id INTO v_class_id
  FROM public.classes
  WHERE UPPER(class_code) = UPPER(p_class_code);
  
  IF v_class_id IS NULL THEN
    RAISE EXCEPTION 'Class not found with code: %', p_class_code;
  END IF;
  
  -- Check if already a member
  SELECT EXISTS (
    SELECT 1 FROM public.class_memberships
    WHERE class_id = v_class_id AND student_id = p_student_id
  ) INTO v_already_member;
  
  IF v_already_member THEN
    RAISE EXCEPTION 'You are already a member of this class';
  END IF;
  
  -- Insert membership
  INSERT INTO public.class_memberships (class_id, student_id)
  VALUES (v_class_id, p_student_id);
  
  RETURN v_class_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permission
GRANT EXECUTE ON FUNCTION join_class_by_code(TEXT, UUID) TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Function join_class_by_code created/updated';
  RAISE NOTICE '✅ Students can now join classes with codes';
END $$;

