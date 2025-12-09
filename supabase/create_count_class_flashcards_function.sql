-- ============================================
-- Function to count flashcards in class modules (bypasses RLS)
-- This ensures students can count flashcards even if RLS blocks direct access
-- ============================================

CREATE OR REPLACE FUNCTION count_class_module_flashcards(
  p_class_id UUID,
  p_user_id UUID
)
RETURNS TABLE (
  module_id UUID,
  total_flashcards INTEGER
) AS $$
BEGIN
  -- Verify user is member of the class
  IF NOT EXISTS (
    SELECT 1 FROM public.class_memberships
    WHERE class_id = p_class_id
    AND student_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'User is not a member of this class';
  END IF;

  -- Return count of flashcards per module
  RETURN QUERY
  SELECT 
    cm.module_id,
    COUNT(fc.id)::INTEGER AS total_flashcards
  FROM public.class_modules cm
  JOIN public.folders f ON f.id = cm.module_id
  JOIN public.sets s ON s.folder_id = f.id
  LEFT JOIN public.flashcards fc ON fc.set_id = s.id
  WHERE cm.class_id = p_class_id
  GROUP BY cm.module_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION count_class_module_flashcards(UUID, UUID) TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Function count_class_module_flashcards created successfully';
END $$;



