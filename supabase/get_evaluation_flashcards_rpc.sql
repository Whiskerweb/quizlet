-- ============================================
-- RPC Function: get_evaluation_flashcards
-- Description: Récupère les flashcards d'une évaluation en contournant RLS
-- Permet aux étudiants d'accéder aux flashcards même si RLS bloque
-- ============================================

CREATE OR REPLACE FUNCTION get_evaluation_flashcards(p_evaluation_id UUID)
RETURNS TABLE (
  id UUID,
  evaluation_id UUID,
  flashcard_id UUID,
  display_order INTEGER,
  flashcard_front TEXT,
  flashcard_back TEXT,
  flashcard_set_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ef.id,
    ef.evaluation_id,
    ef.flashcard_id,
    ef.display_order,
    COALESCE(fc.front, '') AS flashcard_front,
    COALESCE(fc.back, '') AS flashcard_back,
    fc.set_id AS flashcard_set_id
  FROM public.evaluation_flashcards ef
  JOIN public.flashcards fc ON fc.id = ef.flashcard_id
  WHERE ef.evaluation_id = p_evaluation_id
  ORDER BY ef.display_order ASC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_evaluation_flashcards(UUID) TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Function get_evaluation_flashcards created successfully!';
  RAISE NOTICE '   ✓ Allows students to access evaluation flashcards';
  RAISE NOTICE '   ✓ Bypasses RLS with SECURITY DEFINER';
END $$;


