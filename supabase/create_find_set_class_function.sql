-- ============================================
-- Function to find which class a set belongs to (for students)
-- ============================================

CREATE OR REPLACE FUNCTION find_set_class_for_student(
  p_set_id UUID,
  p_student_id UUID
)
RETURNS TABLE (
  class_id UUID,
  class_name TEXT,
  class_description TEXT,
  class_code TEXT,
  class_color TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    c.id AS class_id,
    c.name AS class_name,
    c.description AS class_description,
    c.class_code AS class_code,
    c.color AS class_color
  FROM public.sets s
  JOIN public.class_modules cm ON cm.module_id = s.folder_id
  JOIN public.classes c ON c.id = cm.class_id
  JOIN public.class_memberships cme ON cme.class_id = c.id
  WHERE s.id = p_set_id
  AND cme.student_id = p_student_id
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION find_set_class_for_student(UUID, UUID) TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Function find_set_class_for_student created successfully';
END $$;

