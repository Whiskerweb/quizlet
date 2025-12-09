-- ============================================
-- Fix: get_teacher_classes with qualified columns
-- ============================================

CREATE OR REPLACE FUNCTION get_teacher_classes(p_teacher_id UUID)
RETURNS TABLE (
  class_id UUID,
  class_name TEXT,
  class_description TEXT,
  class_code TEXT,
  class_color TEXT,
  created_at TIMESTAMPTZ,
  student_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id AS class_id,
    c.name AS class_name,
    c.description AS class_description,
    c.class_code AS class_code,
    c.color AS class_color,
    c.created_at AS created_at,
    (SELECT COUNT(*)::INTEGER 
     FROM public.class_memberships cm 
     WHERE cm.class_id = c.id) AS student_count
  FROM public.classes c
  WHERE c.teacher_id = p_teacher_id
  ORDER BY c.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Function get_teacher_classes fixed (qualified columns)';
END $$;

