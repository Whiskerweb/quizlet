-- ============================================
-- EXECUTE ALL MISSING FUNCTIONS
-- Execute this file in Supabase SQL Editor
-- ============================================

-- 1. Create find_set_class_for_student function
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

-- 2. Create/get_set_progress function (fixed version)
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

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ All functions created successfully';
  RAISE NOTICE '   - find_set_class_for_student';
  RAISE NOTICE '   - get_set_progress';
END $$;

