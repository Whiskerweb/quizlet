-- ============================================
-- Function to save answers directly without requiring a session
-- This allows saving answers for local sessions or when API is unavailable
-- ============================================

CREATE OR REPLACE FUNCTION save_answer_direct(
  p_set_id UUID,
  p_flashcard_id UUID,
  p_is_correct BOOLEAN,
  p_time_spent INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_session_id UUID;
  v_answer_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Find or create a session for this set and user
  -- Look for an active session (not completed) first
  SELECT id INTO v_session_id
  FROM public.study_sessions
  WHERE user_id = v_user_id
  AND set_id = p_set_id
  AND completed = false
  ORDER BY started_at DESC
  LIMIT 1;
  
  -- If no active session exists, create a new one
  IF v_session_id IS NULL THEN
    INSERT INTO public.study_sessions (
      user_id,
      set_id,
      mode,
      total_cards,
      completed,
      started_at
    )
    SELECT 
      v_user_id,
      p_set_id,
      'flashcard',
      (SELECT COUNT(*) FROM public.flashcards WHERE set_id = p_set_id),
      false,
      NOW()
    RETURNING id INTO v_session_id;
  END IF;
  
  -- Insert the answer (allow multiple answers for same flashcard to count mastery correctly)
  INSERT INTO public.answers (
    session_id,
    flashcard_id,
    is_correct,
    time_spent,
    answered_at
  )
  VALUES (
    v_session_id,
    p_flashcard_id,
    p_is_correct,
    p_time_spent,
    NOW()
  )
  RETURNING id INTO v_answer_id;
  
  RETURN v_answer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION save_answer_direct(UUID, UUID, BOOLEAN, INTEGER) TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Function save_answer_direct created successfully';
END $$;

