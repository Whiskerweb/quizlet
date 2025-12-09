-- ============================================
-- ASSURER QUE get_class_module_flashcards EXISTE
-- ============================================

DROP FUNCTION IF EXISTS get_class_module_flashcards(UUID);

CREATE OR REPLACE FUNCTION get_class_module_flashcards(p_class_id UUID)
RETURNS TABLE (
  flashcard_id UUID,
  question TEXT,
  answer TEXT,
  set_id UUID,
  set_title TEXT,
  module_id UUID,
  module_name TEXT,
  module_color TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fc.id AS flashcard_id,
    COALESCE(fc.front, '') AS question,
    COALESCE(fc.back, '') AS answer,
    s.id AS set_id,
    s.title AS set_title,
    f.id AS module_id,
    f.name AS module_name,
    COALESCE(f.color, '#3b82f6') AS module_color
  FROM public.class_modules cm
  JOIN public.folders f ON f.id = cm.module_id
  JOIN public.sets s ON s.folder_id = f.id
  JOIN public.flashcards fc ON fc.set_id = s.id
  WHERE cm.class_id = p_class_id
  ORDER BY f.name, s.title, COALESCE(fc.order, 0);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant permission
GRANT EXECUTE ON FUNCTION get_class_module_flashcards(UUID) TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Function get_class_module_flashcards created/updated successfully';
END $$;

