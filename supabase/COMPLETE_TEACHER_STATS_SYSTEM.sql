-- ============================================
-- SYSTÈME COMPLET DE STATISTIQUES PROFESSEUR
-- Version: 1.0
-- Date: 2025
-- Description: Système complet et robuste pour les statistiques des classes
-- ============================================

-- ============================================
-- 1. FONCTION: Sessions actives des élèves
-- ============================================
DROP FUNCTION IF EXISTS get_class_active_sessions(UUID);

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
    COALESCE(p.username, 'Anonyme') AS student_username,
    COALESCE(p.email, '') AS student_email,
    ss.set_id AS set_id,
    COALESCE(s.title, 'Set sans titre') AS set_title,
    COALESCE(ss.mode, 'flashcard') AS mode,
    ss.started_at AS started_at,
    COALESCE(ss.shuffle, false) AS shuffle,
    COALESCE(ss.start_from, 1) AS start_from,
    COALESCE(ss.total_cards, 0) AS total_cards,
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

-- ============================================
-- 2. FONCTION: Stats détaillées par question pour un élève
-- ============================================
DROP FUNCTION IF EXISTS get_student_question_stats(UUID, UUID);

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
    COALESCE(fc.front, '') AS flashcard_front,
    COALESCE(fc.back, '') AS flashcard_back,
    s.id AS set_id,
    COALESCE(s.title, 'Set sans titre') AS set_title,
    COALESCE(f.name, 'Module sans nom') AS module_name,
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
    COALESCE(AVG(a.time_spent)::INTEGER, 0) AS avg_time_spent
  FROM public.flashcards fc
  JOIN public.sets s ON s.id = fc.set_id
  JOIN public.class_modules cm ON cm.module_id = s.folder_id
  JOIN public.folders f ON f.id = s.folder_id
  LEFT JOIN public.answers a ON a.flashcard_id = fc.id
  LEFT JOIN public.study_sessions ss ON ss.id = a.session_id AND ss.user_id = p_student_id
  WHERE cm.class_id = p_class_id
  GROUP BY fc.id, fc.front, fc.back, s.id, s.title, f.name
  HAVING COUNT(a.id) > 0
  ORDER BY success_rate ASC, total_attempts DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_student_question_stats(UUID, UUID) TO authenticated;

-- ============================================
-- 3. FONCTION: Stats agrégées par question pour toute la classe
-- ============================================
DROP FUNCTION IF EXISTS get_class_question_stats(UUID);

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
  WITH class_flashcards AS (
    SELECT DISTINCT fc.id AS flashcard_id, fc.front, fc.back, s.id AS set_id, s.title AS set_title, f.name AS module_name
    FROM public.flashcards fc
    JOIN public.sets s ON s.id = fc.set_id
    JOIN public.class_modules cm ON cm.module_id = s.folder_id
    JOIN public.folders f ON f.id = s.folder_id
    WHERE cm.class_id = p_class_id
  ),
  student_attempts AS (
    SELECT 
      a.flashcard_id,
      COUNT(DISTINCT ss.user_id) AS students_attempted,
      COUNT(a.id) AS total_attempts,
      COUNT(CASE WHEN a.is_correct = true THEN 1 END) AS total_correct,
      COUNT(CASE WHEN a.is_correct = false THEN 1 END) AS total_incorrect,
      AVG(a.time_spent) AS avg_time
    FROM public.answers a
    JOIN public.study_sessions ss ON ss.id = a.session_id
    JOIN public.class_memberships cm ON cm.student_id = ss.user_id
    JOIN public.sets s ON s.id = ss.set_id
    JOIN public.class_modules cm_mod ON cm_mod.module_id = s.folder_id
    WHERE cm.class_id = p_class_id
    AND cm_mod.class_id = p_class_id
    GROUP BY a.flashcard_id
  ),
  student_mastery AS (
    SELECT 
      a.flashcard_id,
      ss.user_id,
      COUNT(CASE WHEN a.is_correct = true THEN 1 END) AS correct_count
    FROM public.answers a
    JOIN public.study_sessions ss ON ss.id = a.session_id
    JOIN public.class_memberships cm ON cm.student_id = ss.user_id
    JOIN public.sets s ON s.id = ss.set_id
    JOIN public.class_modules cm_mod ON cm_mod.module_id = s.folder_id
    WHERE cm.class_id = p_class_id
    AND cm_mod.class_id = p_class_id
    GROUP BY a.flashcard_id, ss.user_id
    HAVING COUNT(CASE WHEN a.is_correct = true THEN 1 END) >= 2
  )
  SELECT 
    cf.flashcard_id,
    COALESCE(cf.front, '') AS flashcard_front,
    COALESCE(cf.back, '') AS flashcard_back,
    cf.set_id,
    COALESCE(cf.set_title, 'Set sans titre') AS set_title,
    COALESCE(cf.module_name, 'Module sans nom') AS module_name,
    COALESCE(sa.students_attempted, 0)::INTEGER AS total_students_attempted,
    COALESCE(sa.total_attempts, 0)::INTEGER AS total_attempts,
    COALESCE(sa.total_correct, 0)::INTEGER AS total_correct,
    COALESCE(sa.total_incorrect, 0)::INTEGER AS total_incorrect,
    CASE 
      WHEN sa.total_attempts > 0 THEN
        ROUND((sa.total_correct::DECIMAL / sa.total_attempts::DECIMAL * 100)::NUMERIC, 2)
      ELSE 0
    END AS avg_success_rate,
    COUNT(DISTINCT sm.user_id)::INTEGER AS students_mastered,
    COALESCE(sa.avg_time::INTEGER, 0) AS avg_time_spent
  FROM class_flashcards cf
  LEFT JOIN student_attempts sa ON sa.flashcard_id = cf.flashcard_id
  LEFT JOIN student_mastery sm ON sm.flashcard_id = cf.flashcard_id
  GROUP BY 
    cf.flashcard_id, cf.front, cf.back, cf.set_id, cf.set_title, cf.module_name,
    sa.students_attempted, sa.total_attempts, sa.total_correct, sa.total_incorrect, sa.avg_time
  HAVING COALESCE(sa.total_attempts, 0) > 0  -- Ne retourner que les questions qui ont été tentées
  ORDER BY avg_success_rate ASC, total_attempts DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_class_question_stats(UUID) TO authenticated;

-- ============================================
-- 4. FONCTION: Stats complètes de tous les élèves (MISE À JOUR)
-- ============================================
DROP FUNCTION IF EXISTS get_all_class_students_stats(UUID);

CREATE OR REPLACE FUNCTION get_all_class_students_stats(p_class_id UUID)
RETURNS TABLE (
  student_id UUID,
  username TEXT,
  email TEXT,
  avatar TEXT,
  joined_at TIMESTAMPTZ,
  total_sessions INTEGER,
  mastered_cards INTEGER,
  completion_rate DECIMAL,
  avg_score DECIMAL,
  last_activity TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id AS student_id,
    COALESCE(p.username, 'Anonyme') AS username,
    COALESCE(p.email, '') AS email,
    COALESCE(p.avatar, NULL) AS avatar,
    cm.joined_at,
    -- Total sessions (toutes sessions, complétées ou non)
    COALESCE((
      SELECT COUNT(*)::INTEGER
      FROM public.class_modules cmod
      JOIN public.folders f ON f.id = cmod.module_id
      JOIN public.sets s ON s.folder_id = f.id
      JOIN public.study_sessions ss ON ss.set_id = s.id
      WHERE cmod.class_id = p_class_id
      AND ss.user_id = p.id
    ), 0) AS total_sessions,
    
    -- Cartes maîtrisées (même logique que get_set_progress)
    COALESCE((
      SELECT COUNT(DISTINCT fc.id)::INTEGER
      FROM public.class_modules cmod
      JOIN public.folders f ON f.id = cmod.module_id
      JOIN public.sets s ON s.folder_id = f.id
      JOIN public.flashcards fc ON fc.set_id = s.id
      WHERE cmod.class_id = p_class_id
      AND (
        -- Card has been answered correctly at least 2 times
        (
          SELECT COUNT(*)::INTEGER
          FROM public.answers a
          JOIN public.study_sessions ss ON ss.id = a.session_id
          WHERE a.flashcard_id = fc.id
          AND ss.user_id = p.id
          AND ss.set_id = s.id
          AND a.is_correct = true
        ) >= 2
        OR
        -- Card has progress with repetitions >= 2
        EXISTS (
          SELECT 1 FROM public.card_progress cp
          WHERE cp.flashcard_id = fc.id
          AND cp.user_id = p.id
          AND cp.repetitions >= 2
        )
      )
    ), 0) AS mastered_cards,
    
    -- Taux de complétion
    COALESCE((
      WITH total_cards AS (
        SELECT COUNT(DISTINCT fc.id)::DECIMAL AS total
        FROM public.class_modules cmod
        JOIN public.folders f ON f.id = cmod.module_id
        JOIN public.sets s ON s.folder_id = f.id
        JOIN public.flashcards fc ON fc.set_id = s.id
        WHERE cmod.class_id = p_class_id
      ),
      mastered_cards AS (
        SELECT COUNT(DISTINCT fc.id)::DECIMAL AS mastered
        FROM public.class_modules cmod
        JOIN public.folders f ON f.id = cmod.module_id
        JOIN public.sets s ON s.folder_id = f.id
        JOIN public.flashcards fc ON fc.set_id = s.id
        WHERE cmod.class_id = p_class_id
        AND (
          (
            SELECT COUNT(*)::INTEGER
            FROM public.answers a
            JOIN public.study_sessions ss ON ss.id = a.session_id
            WHERE a.flashcard_id = fc.id
            AND ss.user_id = p.id
            AND ss.set_id = s.id
            AND a.is_correct = true
          ) >= 2
          OR
          EXISTS (
            SELECT 1 FROM public.card_progress cp
            WHERE cp.flashcard_id = fc.id
            AND cp.user_id = p.id
            AND cp.repetitions >= 2
          )
        )
      )
      SELECT 
        CASE 
          WHEN tc.total > 0 THEN (mc.mastered / tc.total * 100)
          ELSE 0
        END
      FROM total_cards tc
      CROSS JOIN mastered_cards mc
    ), 0) AS completion_rate,
    
    -- Score moyen (seulement les sessions avec score)
    COALESCE((
      SELECT AVG(ss.score::DECIMAL)
      FROM public.class_modules cmod
      JOIN public.folders f ON f.id = cmod.module_id
      JOIN public.sets s ON s.folder_id = f.id
      JOIN public.study_sessions ss ON ss.set_id = s.id
      WHERE cmod.class_id = p_class_id
      AND ss.user_id = p.id
      AND ss.score IS NOT NULL
    ), 0) AS avg_score,
    
    -- Dernière activité
    (
      SELECT MAX(ss.started_at)
      FROM public.class_modules cmod
      JOIN public.folders f ON f.id = cmod.module_id
      JOIN public.sets s ON s.folder_id = f.id
      JOIN public.study_sessions ss ON ss.set_id = s.id
      WHERE cmod.class_id = p_class_id
      AND ss.user_id = p.id
    ) AS last_activity
     
  FROM public.class_memberships cm
  JOIN public.profiles p ON p.id = cm.student_id
  WHERE cm.class_id = p_class_id
  ORDER BY cm.joined_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_all_class_students_stats(UUID) TO authenticated;

-- ============================================
-- SUCCÈS
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Système complet de statistiques professeur créé avec succès!';
  RAISE NOTICE '   ✓ get_class_active_sessions';
  RAISE NOTICE '   ✓ get_student_question_stats';
  RAISE NOTICE '   ✓ get_class_question_stats';
  RAISE NOTICE '   ✓ get_all_class_students_stats (mise à jour)';
END $$;

