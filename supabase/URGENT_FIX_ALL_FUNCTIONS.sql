-- ============================================
-- ⚠️ URGENT: Execute ALL missing functions
-- Execute this file FIRST in Supabase SQL Editor
-- ============================================

-- 1. Create find_set_class_for_student function (MISSING - 404 error)
CREATE OR REPLACE FUNCTION find_set_class_for_student(
  p_set_id UUID,
  p_student_id UUID
)
RETURNS TABLE (
  class_id UUID,
  class_name TEXT,
  class_description TEXT,
  class_code TEXT,
  class_color TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    c.id AS class_id,
    c.name AS class_name,
    c.description AS class_description,
    c.class_code AS class_code,
    c.color AS class_color
  FROM public.sets s
  JOIN public.class_modules cm ON cm.module_id = s.folder_id
  JOIN public.classes c ON c.id = cm.class_id
  JOIN public.class_memberships cme ON cme.class_id = c.id
  WHERE s.id = p_set_id
  AND cme.student_id = p_student_id
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION find_set_class_for_student(UUID, UUID) TO authenticated;

-- 2. Create get_set_progress function (MISSING or broken)
DROP FUNCTION IF EXISTS get_set_progress(UUID, UUID);

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
  
  -- Get number of mastered cards
  -- A card is mastered if it has been answered correctly at least 2 times in ANY session
  SELECT COUNT(DISTINCT fc.id)::INTEGER INTO v_mastered_cards
  FROM public.flashcards fc
  WHERE fc.set_id = p_set_id
  AND (
    -- Card has been answered correctly at least 2 times in any session for this set
    (
      SELECT COUNT(*)::INTEGER
      FROM public.answers a
      JOIN public.study_sessions ss ON ss.id = a.session_id
      WHERE a.flashcard_id = fc.id
      AND ss.user_id = p_user_id
      AND ss.set_id = p_set_id
      AND a.is_correct = true
    ) >= 2
    OR
    -- Card has progress with repetitions >= 2
    EXISTS (
      SELECT 1 FROM public.card_progress cp
      WHERE cp.flashcard_id = fc.id
      AND cp.user_id = p_user_id
      AND cp.repetitions >= 2
    )
  );
  
  -- Calculate percentage
  v_progress_percentage := ROUND((v_mastered_cards::DECIMAL / v_total_cards::DECIMAL * 100)::NUMERIC);
  
  -- Ensure percentage is between 0 and 100
  IF v_progress_percentage < 0 THEN
    v_progress_percentage := 0;
  ELSIF v_progress_percentage > 100 THEN
    v_progress_percentage := 100;
  END IF;
  
  RETURN QUERY SELECT v_total_cards, v_mastered_cards, v_progress_percentage;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_set_progress(UUID, UUID) TO authenticated;

-- 3. Update get_class_module_sets to include module_shared_at
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

-- 4. Create save_answer_direct function (for saving answers even in local sessions)
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
  RAISE NOTICE '✅ ALL functions created/updated successfully!';
  RAISE NOTICE '   ✓ find_set_class_for_student';
  RAISE NOTICE '   ✓ get_set_progress';
  RAISE NOTICE '   ✓ get_class_module_sets (with module_shared_at)';
  RAISE NOTICE '   ✓ save_answer_direct (for local sessions)';
END $$;

