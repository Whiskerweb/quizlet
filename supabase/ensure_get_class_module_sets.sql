-- ============================================
-- ASSURER QUE get_class_module_sets EXISTE
-- ============================================

-- Drop and recreate to ensure it's correct
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
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id AS set_id,
    s.title AS set_title,
    s.description AS set_description,
    s.language AS set_language,
    (SELECT COUNT(*)::INTEGER FROM public.flashcards fc WHERE fc.set_id = s.id) AS flashcard_count,
    s.created_at AS created_at
  FROM public.sets s
  WHERE s.folder_id = p_module_id
  AND EXISTS (
    SELECT 1 FROM public.class_modules cm
    WHERE cm.class_id = p_class_id AND cm.module_id = p_module_id
  )
  ORDER BY s.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant permission
GRANT EXECUTE ON FUNCTION get_class_module_sets(UUID, UUID) TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Function get_class_module_sets created/updated successfully';
END $$;

