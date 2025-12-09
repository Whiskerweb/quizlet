-- ============================================
-- Function to get set progress for a user
-- ============================================

CREATE OR REPLACE FUNCTION get_set_progress(
  p_set_id UUID,
  p_user_id UUID
)
RETURNS TABLE (
  total_cards INTEGER,
  mastered_cards INTEGER,
  progress_percentage INTEGER
) AS $$
DECLARE
  v_total_cards INTEGER;
  v_mastered_cards INTEGER;
  v_progress_percentage INTEGER;
BEGIN
  -- Get total number of flashcards in the set
  SELECT COUNT(*)::INTEGER INTO v_total_cards
  FROM public.flashcards
  WHERE set_id = p_set_id;
  
  IF v_total_cards = 0 THEN
    RETURN QUERY SELECT 0::INTEGER, 0::INTEGER, 0::INTEGER;
    RETURN;
  END IF;
  
  -- Get number of mastered cards (cards with progress where last_review exists and repetitions >= 2)
  -- Or cards that have been answered correctly at least 2 times
  SELECT COUNT(DISTINCT fc.id)::INTEGER INTO v_mastered_cards
  FROM public.flashcards fc
  WHERE fc.set_id = p_set_id
  AND (
    -- Card has progress with repetitions >= 2
    EXISTS (
      SELECT 1 FROM public.card_progress cp
      WHERE cp.flashcard_id = fc.id
      AND cp.user_id = p_user_id
      AND cp.repetitions >= 2
      AND cp.last_review IS NOT NULL
    )
    OR
    -- Card has been answered correctly at least 2 times in completed sessions
    (
      SELECT COUNT(*)::INTEGER
      FROM public.answers a
      JOIN public.study_sessions ss ON ss.id = a.session_id
      WHERE a.flashcard_id = fc.id
      AND ss.user_id = p_user_id
      AND ss.set_id = p_set_id
      AND ss.completed = true
      AND a.is_correct = true
    ) >= 2
  );
  
  -- Calculate percentage
  v_progress_percentage := ROUND((v_mastered_cards::DECIMAL / v_total_cards::DECIMAL * 100)::NUMERIC);
  
  RETURN QUERY SELECT v_total_cards, v_mastered_cards, v_progress_percentage;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_set_progress(UUID, UUID) TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Function get_set_progress created successfully';
END $$;

