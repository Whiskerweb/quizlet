-- ============================================
-- Fix v2: Simplified class creation
-- Remove auth.uid() dependency
-- ============================================

-- Drop old function if exists
DROP FUNCTION IF EXISTS create_class_safe(TEXT, TEXT, TEXT, UUID);
DROP FUNCTION IF EXISTS create_class_safe(TEXT, TEXT, TEXT);

-- Create simplified function
CREATE OR REPLACE FUNCTION create_class_safe(
  p_name TEXT,
  p_description TEXT,
  p_color TEXT,
  p_teacher_id UUID
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
  v_teacher_role TEXT;
BEGIN
  -- Simple validation: check if teacher exists and has teacher role
  SELECT p.role INTO v_teacher_role 
  FROM public.profiles p
  WHERE p.id = p_teacher_id;
  
  IF v_teacher_role IS NULL THEN
    RAISE EXCEPTION 'User not found: %', p_teacher_id;
  END IF;
  
  IF v_teacher_role != 'teacher' THEN
    RAISE EXCEPTION 'User % is not a teacher (role: %)', p_teacher_id, v_teacher_role;
  END IF;
  
  -- Insert and return the new class
  RETURN QUERY
  INSERT INTO public.classes (name, description, teacher_id, color)
  VALUES (p_name, p_description, p_teacher_id, p_color)
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

-- Test query (optional, comment out after testing)
-- SELECT * FROM create_class_safe('Test Class', 'Test Description', '#3b82f6', 'YOUR_USER_ID_HERE');

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Function create_class_safe v2 created successfully';
  RAISE NOTICE '📝 Usage: SELECT * FROM create_class_safe(name, description, color, teacher_id)';
END $$;

