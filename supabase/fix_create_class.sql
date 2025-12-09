-- ============================================
-- Fix: Add safe class creation function
-- ============================================

-- Create a safe function to create classes
CREATE OR REPLACE FUNCTION create_class_safe(
  p_name TEXT,
  p_description TEXT DEFAULT NULL,
  p_color TEXT DEFAULT '#3b82f6',
  p_teacher_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  class_code TEXT,
  teacher_id UUID,
  color TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
DECLARE
  v_teacher_id UUID;
  v_teacher_role TEXT;
BEGIN
  -- Get teacher ID from parameter or auth
  v_teacher_id := COALESCE(p_teacher_id, auth.uid());
  
  IF v_teacher_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Check if user is a teacher
  SELECT role INTO v_teacher_role 
  FROM public.profiles 
  WHERE id = v_teacher_id;
  
  IF v_teacher_role IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  IF v_teacher_role != 'teacher' THEN
    RAISE EXCEPTION 'Only teachers can create classes';
  END IF;
  
  -- Insert and return the new class
  RETURN QUERY
  INSERT INTO public.classes (name, description, teacher_id, color)
  VALUES (p_name, p_description, v_teacher_id, p_color)
  RETURNING 
    classes.id,
    classes.name,
    classes.description,
    classes.class_code,
    classes.teacher_id,
    classes.color,
    classes.created_at,
    classes.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_class_safe(TEXT, TEXT, TEXT, UUID) TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Function create_class_safe created successfully';
END $$;

