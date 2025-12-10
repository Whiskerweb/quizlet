-- ============================================
-- SECURITY FIX: Add transaction locking for card_progress updates
-- This prevents race conditions when multiple sessions update the same card
-- ============================================

CREATE OR REPLACE FUNCTION update_card_progress_safe(
  p_flashcard_id UUID,
  p_is_correct BOOLEAN,
  p_quality INTEGER DEFAULT 4
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_progress RECORD;
  v_new_repetitions INTEGER;
  v_new_ease_factor DECIMAL;
  v_new_interval INTEGER;
  v_next_review TIMESTAMPTZ;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- ✅ SECURITY FIX: Use SELECT FOR UPDATE to lock the row
  SELECT * INTO v_progress
  FROM public.card_progress
  WHERE user_id = v_user_id
  AND flashcard_id = p_flashcard_id
  FOR UPDATE;  -- Lock this row for the duration of the transaction
  
  -- If no progress exists, create it
  IF v_progress IS NULL THEN
    INSERT INTO public.card_progress (
      user_id,
      flashcard_id,
      ease_factor,
      interval,
      repetitions,
      next_review,
      last_review
    )
    VALUES (
      v_user_id,
      p_flashcard_id,
      2.5,
      0,
      CASE WHEN p_is_correct THEN 1 ELSE 0 END,
      NOW(),
      NOW()
    )
    RETURNING * INTO v_progress;
  ELSE
    -- Update existing progress
    IF p_is_correct THEN
      v_new_repetitions := v_progress.repetitions + 1;
      v_new_ease_factor := GREATEST(1.3, v_progress.ease_factor + 0.1);
      
      IF v_new_repetitions = 1 THEN
        v_new_interval := 1;
      ELSIF v_new_repetitions = 2 THEN
        v_new_interval := 6;
      ELSE
        v_new_interval := ROUND(v_progress.interval * v_new_ease_factor);
      END IF;
    ELSE
      v_new_repetitions := 0;
      v_new_ease_factor := GREATEST(1.3, v_progress.ease_factor - 0.2);
      v_new_interval := 1;
    END IF;
    
    v_next_review := NOW() + (v_new_interval || ' days')::INTERVAL;
    
    UPDATE public.card_progress
    SET 
      ease_factor = v_new_ease_factor,
      interval = v_new_interval,
      repetitions = v_new_repetitions,
      next_review = v_next_review,
      last_review = NOW(),
      updated_at = NOW()
    WHERE user_id = v_user_id
    AND flashcard_id = p_flashcard_id
    RETURNING * INTO v_progress;
  END IF;
  
  RETURN jsonb_build_object(
    'repetitions', v_progress.repetitions,
    'ease_factor', v_progress.ease_factor,
    'interval', v_progress.interval,
    'next_review', v_progress.next_review
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION update_card_progress_safe(UUID, BOOLEAN, INTEGER) TO authenticated;

DO $$
BEGIN
  RAISE NOTICE '✅ SECURITY FIX: Card progress locking function created';
END $$;
