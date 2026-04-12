-- ============================================
-- Teacher Class Sessions Stats Functions
-- Allows teachers to see all students' sessions and detailed stats
-- ============================================

-- Function 1: Get all active sessions for students in a class
CREATE OR REPLACE FUNCTION get_class_active_sessions(p_class_id UUID)
RETURNS TABLE (
  session_id UUID,
  student_id UUID,
  student_username TEXT,
  student_email TEXT,
  set_id UUID,
  set_title TEXT,
  mode TEXT,
  started_at TIMESTAMPTZ,
  shuffle BOOLEAN,
  start_from INTEGER,
  total_cards INTEGER,
  session_state JSONB,
  card_order JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ss.id AS session_id,
    ss.user_id AS student_id,
    p.username AS student_username,
    p.email AS student_email,
    ss.set_id AS set_id,
    s.title AS set_title,
    ss.mode AS mode,
    ss.started_at AS started_at,
    COALESCE(ss.shuffle, false) AS shuffle,
    COALESCE(ss.start_from, 1) AS start_from,
    ss.total_cards AS total_cards,
    ss.session_state AS session_state,
    ss.card_order AS card_order
  FROM public.study_sessions ss
  JOIN public.class_memberships cm ON cm.student_id = ss.user_id
  JOIN public.profiles p ON p.id = ss.user_id
  JOIN public.sets s ON s.id = ss.set_id
  JOIN public.class_modules cm_mod ON cm_mod.module_id = s.folder_id
  WHERE cm.class_id = p_class_id
  AND cm_mod.class_id = p_class_id
  AND ss.completed = false
  ORDER BY ss.started_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_class_active_sessions(UUID) TO authenticated;

-- Function 2: Get detailed question-by-question stats for a student in a class
CREATE OR REPLACE FUNCTION get_student_question_stats(
  p_class_id UUID,
  p_student_id UUID
)
RETURNS TABLE (
  flashcard_id UUID,
  flashcard_front TEXT,
  flashcard_back TEXT,
  set_id UUID,
  set_title TEXT,
  module_name TEXT,
  total_attempts INTEGER,
  correct_count INTEGER,
  incorrect_count INTEGER,
  success_rate NUMERIC,
  last_answered_at TIMESTAMPTZ,
  is_mastered BOOLEAN,
  avg_time_spent INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fc.id AS flashcard_id,
    fc.front AS flashcard_front,
    fc.back AS flashcard_back,
    s.id AS set_id,
    s.title AS set_title,
    f.name AS module_name,
    COUNT(a.id)::INTEGER AS total_attempts,
    COUNT(CASE WHEN a.is_correct = true THEN 1 END)::INTEGER AS correct_count,
    COUNT(CASE WHEN a.is_correct = false THEN 1 END)::INTEGER AS incorrect_count,
    CASE 
      WHEN COUNT(a.id) > 0 THEN
        ROUND((COUNT(CASE WHEN a.is_correct = true THEN 1 END)::DECIMAL / COUNT(a.id)::DECIMAL * 100)::NUMERIC, 2)
      ELSE 0
    END AS success_rate,
    MAX(a.answered_at) AS last_answered_at,
    CASE 
      WHEN COUNT(CASE WHEN a.is_correct = true THEN 1 END) >= 2 THEN true
      ELSE false
    END AS is_mastered,
    AVG(a.time_spent)::INTEGER AS avg_time_spent
  FROM public.flashcards fc
  JOIN public.sets s ON s.id = fc.set_id
  JOIN public.class_modules cm ON cm.module_id = s.folder_id
  JOIN public.folders f ON f.id = s.folder_id
  LEFT JOIN public.answers a ON a.flashcard_id = fc.id
  LEFT JOIN public.study_sessions ss ON ss.id = a.session_id
  WHERE cm.class_id = p_class_id
  AND (ss.user_id = p_student_id OR ss.user_id IS NULL)
  GROUP BY fc.id, fc.front, fc.back, s.id, s.title, f.name
  ORDER BY success_rate ASC, total_attempts DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_student_question_stats(UUID, UUID) TO authenticated;

-- Function 3: Get question stats for all students in a class (aggregated)
CREATE OR REPLACE FUNCTION get_class_question_stats(p_class_id UUID)
RETURNS TABLE (
  flashcard_id UUID,
  flashcard_front TEXT,
  flashcard_back TEXT,
  set_id UUID,
  set_title TEXT,
  module_name TEXT,
  total_students_attempted INTEGER,
  total_attempts INTEGER,
  total_correct INTEGER,
  total_incorrect INTEGER,
  avg_success_rate NUMERIC,
  students_mastered INTEGER,
  avg_time_spent INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fc.id AS flashcard_id,
    fc.front AS flashcard_front,
    fc.back AS flashcard_back,
    s.id AS set_id,
    s.title AS set_title,
    f.name AS module_name,
    COUNT(DISTINCT ss.user_id)::INTEGER AS total_students_attempted,
    COUNT(a.id)::INTEGER AS total_attempts,
    COUNT(CASE WHEN a.is_correct = true THEN 1 END)::INTEGER AS total_correct,
    COUNT(CASE WHEN a.is_correct = false THEN 1 END)::INTEGER AS total_incorrect,
    CASE 
      WHEN COUNT(a.id) > 0 THEN
        ROUND((COUNT(CASE WHEN a.is_correct = true THEN 1 END)::DECIMAL / COUNT(a.id)::DECIMAL * 100)::NUMERIC, 2)
      ELSE 0
    END AS avg_success_rate,
    COUNT(DISTINCT CASE 
      WHEN EXISTS (
        SELECT 1 FROM public.answers a2
        JOIN public.study_sessions ss2 ON ss2.id = a2.session_id
        WHERE a2.flashcard_id = fc.id
        AND ss2.user_id = ss.user_id
        AND a2.is_correct = true
        GROUP BY a2.flashcard_id, ss2.user_id
        HAVING COUNT(*) >= 2
      ) THEN ss.user_id
    END)::INTEGER AS students_mastered,
    AVG(a.time_spent)::INTEGER AS avg_time_spent
  FROM public.flashcards fc
  JOIN public.sets s ON s.id = fc.set_id
  JOIN public.class_modules cm ON cm.module_id = s.folder_id
  JOIN public.folders f ON f.id = s.folder_id
  JOIN public.class_memberships cmem ON cmem.class_id = p_class_id
  LEFT JOIN public.answers a ON a.flashcard_id = fc.id
  LEFT JOIN public.study_sessions ss ON ss.id = a.session_id AND ss.user_id = cmem.student_id
  WHERE cm.class_id = p_class_id
  GROUP BY fc.id, fc.front, fc.back, s.id, s.title, f.name
  ORDER BY avg_success_rate ASC, total_attempts DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_class_question_stats(UUID) TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Teacher class sessions stats functions created successfully!';
  RAISE NOTICE '   ✓ get_class_active_sessions';
  RAISE NOTICE '   ✓ get_student_question_stats';
  RAISE NOTICE '   ✓ get_class_question_stats';
END $$;



