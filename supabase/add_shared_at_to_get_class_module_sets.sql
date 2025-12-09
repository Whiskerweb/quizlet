-- ============================================
-- Add shared_at to get_class_module_sets function
-- ============================================

DROP FUNCTION IF EXISTS get_class_module_sets(UUID, UUID);

CREATE OR REPLACE FUNCTION get_class_module_sets(
  p_class_id UUID,
  p_module_id UUID
)
RETURNS TABLE (
  set_id UUID,
  set_title TEXT,
  set_description TEXT,
  set_language TEXT,
  flashcard_count INTEGER,
  created_at TIMESTAMPTZ,
  module_shared_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id AS set_id,
    s.title AS set_title,
    s.description AS set_description,
    s.language AS set_language,
    (SELECT COUNT(*)::INTEGER FROM public.flashcards WHERE flashcards.set_id = s.id) AS flashcard_count,
    s.created_at AS created_at,
    cm.shared_at AS module_shared_at
  FROM public.sets s
  JOIN public.class_modules cm ON cm.module_id = s.folder_id
  WHERE s.folder_id = p_module_id
  AND cm.class_id = p_class_id
  ORDER BY s.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_class_module_sets(UUID, UUID) TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Function get_class_module_sets updated to include module_shared_at';
END $$;

