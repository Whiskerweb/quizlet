-- ============================================
-- FIX: Function get_student_classes (remove ambiguity)
-- ============================================

DROP FUNCTION IF EXISTS get_student_classes(UUID);

CREATE OR REPLACE FUNCTION get_student_classes(p_student_id UUID)
RETURNS TABLE (
  class_id UUID,
  class_name TEXT,
  class_description TEXT,
  class_color TEXT,
  class_code TEXT,
  teacher_username TEXT,
  joined_at TIMESTAMPTZ,
  student_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id AS class_id,
    c.name AS class_name,
    c.description AS class_description,
    c.color AS class_color,
    c.class_code AS class_code,
    p.username AS teacher_username,
    cm.joined_at AS joined_at,
    (SELECT COUNT(*)::INTEGER FROM public.class_memberships WHERE class_memberships.class_id = c.id) AS student_count
  FROM public.class_memberships cm
  JOIN public.classes c ON c.id = cm.class_id
  JOIN public.profiles p ON p.id = c.teacher_id
  WHERE cm.student_id = p_student_id
  ORDER BY cm.joined_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant permission
GRANT EXECUTE ON FUNCTION get_student_classes(UUID) TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Function get_student_classes fixed (column ambiguity resolved)';
END $$;

