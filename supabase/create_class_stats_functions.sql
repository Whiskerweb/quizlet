-- ============================================
-- FONCTIONS STATISTIQUES CLASSE (PROF)
-- ============================================

-- 1. Stats globales de la classe
CREATE OR REPLACE FUNCTION get_class_stats_real(p_class_id UUID)
RETURNS TABLE (
  total_students INTEGER,
  active_students INTEGER,
  total_modules INTEGER,
  total_cards INTEGER,
  avg_completion DECIMAL,
  total_study_sessions INTEGER,
  avg_score DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    -- Total élèves
    (SELECT COUNT(*)::INTEGER 
     FROM public.class_memberships 
     WHERE class_memberships.class_id = p_class_id) AS total_students,
    
    -- Élèves actifs (ont eu une session dans les 7 derniers jours)
    (SELECT COUNT(DISTINCT ss.user_id)::INTEGER
     FROM public.class_memberships cm
     JOIN public.class_modules cmod ON cmod.class_id = cm.class_id
     JOIN public.folders f ON f.id = cmod.module_id
     JOIN public.sets s ON s.folder_id = f.id
     JOIN public.study_sessions ss ON ss.set_id = s.id
     WHERE cm.class_id = p_class_id
     AND ss.started_at > NOW() - INTERVAL '7 days') AS active_students,
    
    -- Total modules partagés
    (SELECT COUNT(*)::INTEGER 
     FROM public.class_modules 
     WHERE class_modules.class_id = p_class_id) AS total_modules,
    
    -- Total cardz (flashcards) dans tous les modules
    (SELECT COUNT(DISTINCT fc.id)::INTEGER
     FROM public.class_modules cmod
     JOIN public.folders f ON f.id = cmod.module_id
     JOIN public.sets s ON s.folder_id = f.id
     JOIN public.flashcards fc ON fc.set_id = s.id
     WHERE cmod.class_id = p_class_id) AS total_cards,
    
    -- Progression moyenne (% de cartes maîtrisées)
    COALESCE((
      SELECT AVG(
        CASE 
          WHEN student_progress.total_cards_in_modules > 0 THEN
            (student_progress.mastered_cards::DECIMAL / student_progress.total_cards_in_modules::DECIMAL) * 100
          ELSE 0
        END
      )
      FROM (
        SELECT 
          cm.student_id,
          COUNT(DISTINCT cp.flashcard_id) FILTER (WHERE cp.repetitions >= 3) AS mastered_cards,
          (SELECT COUNT(DISTINCT fc.id)
           FROM public.class_modules cmod
           JOIN public.folders f ON f.id = cmod.module_id
           JOIN public.sets s ON s.folder_id = f.id
           JOIN public.flashcards fc ON fc.set_id = s.id
           WHERE cmod.class_id = p_class_id) AS total_cards_in_modules
        FROM public.class_memberships cm
        LEFT JOIN public.class_modules cmod ON cmod.class_id = cm.class_id
        LEFT JOIN public.folders f ON f.id = cmod.module_id
        LEFT JOIN public.sets s ON s.folder_id = f.id
        LEFT JOIN public.flashcards fc ON fc.set_id = s.id
        LEFT JOIN public.card_progress cp ON cp.flashcard_id = fc.id AND cp.user_id = cm.student_id
        WHERE cm.class_id = p_class_id
        GROUP BY cm.student_id
      ) student_progress
    ), 0) AS avg_completion,
    
    -- Total sessions d'étude
    (SELECT COUNT(*)::INTEGER
     FROM public.class_modules cmod
     JOIN public.folders f ON f.id = cmod.module_id
     JOIN public.sets s ON s.folder_id = f.id
     JOIN public.study_sessions ss ON ss.set_id = s.id
     WHERE cmod.class_id = p_class_id) AS total_study_sessions,
    
    -- Score moyen
    COALESCE((
      SELECT AVG(ss.score::DECIMAL)
      FROM public.class_modules cmod
      JOIN public.folders f ON f.id = cmod.module_id
      JOIN public.sets s ON s.folder_id = f.id
      JOIN public.study_sessions ss ON ss.set_id = s.id
      WHERE cmod.class_id = p_class_id
      AND ss.score IS NOT NULL
    ), 0) AS avg_score;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 2. Stats par élève dans la classe
CREATE OR REPLACE FUNCTION get_class_student_stats(
  p_class_id UUID,
  p_student_id UUID
)
RETURNS TABLE (
  student_id UUID,
  username TEXT,
  email TEXT,
  avatar TEXT,
  joined_at TIMESTAMPTZ,
  total_sessions INTEGER,
  total_cards_studied INTEGER,
  mastered_cards INTEGER,
  completion_rate DECIMAL,
  avg_score DECIMAL,
  last_activity TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id AS student_id,
    p.username,
    p.email,
    p.avatar,
    cm.joined_at,
    -- Total sessions
    (SELECT COUNT(*)::INTEGER
     FROM public.class_modules cmod
     JOIN public.folders f ON f.id = cmod.module_id
     JOIN public.sets s ON s.folder_id = f.id
     JOIN public.study_sessions ss ON ss.set_id = s.id
     WHERE cmod.class_id = p_class_id
     AND ss.user_id = p_student_id) AS total_sessions,
    
    -- Total cartes étudiées
    (SELECT COUNT(DISTINCT cp.flashcard_id)::INTEGER
     FROM public.class_modules cmod
     JOIN public.folders f ON f.id = cmod.module_id
     JOIN public.sets s ON s.folder_id = f.id
     JOIN public.flashcards fc ON fc.set_id = s.id
     JOIN public.card_progress cp ON cp.flashcard_id = fc.id AND cp.user_id = p_student_id
     WHERE cmod.class_id = p_class_id) AS total_cards_studied,
    
    -- Cartes maîtrisées (repetitions >= 3)
    (SELECT COUNT(DISTINCT cp.flashcard_id)::INTEGER
     FROM public.class_modules cmod
     JOIN public.folders f ON f.id = cmod.module_id
     JOIN public.sets s ON s.folder_id = f.id
     JOIN public.flashcards fc ON fc.set_id = s.id
     JOIN public.card_progress cp ON cp.flashcard_id = fc.id AND cp.user_id = p_student_id
     WHERE cmod.class_id = p_class_id
     AND cp.repetitions >= 3) AS mastered_cards,
    
    -- Taux de complétion
    COALESCE((
      SELECT 
        CASE 
          WHEN progress.total_cards > 0 THEN
            (progress.mastered_cards::DECIMAL / progress.total_cards::DECIMAL) * 100
          ELSE 0
        END
      FROM (
        SELECT 
          COUNT(DISTINCT fc.id) AS total_cards,
          COUNT(DISTINCT cp.flashcard_id) FILTER (WHERE cp.repetitions >= 3) AS mastered_cards
        FROM public.class_modules cmod
        JOIN public.folders f ON f.id = cmod.module_id
        JOIN public.sets s ON s.folder_id = f.id
        JOIN public.flashcards fc ON fc.set_id = s.id
        LEFT JOIN public.card_progress cp ON cp.flashcard_id = fc.id AND cp.user_id = p_student_id
        WHERE cmod.class_id = p_class_id
      ) progress
    ), 0) AS completion_rate,
    
    -- Score moyen
    COALESCE((
      SELECT AVG(ss.score::DECIMAL)
      FROM public.class_modules cmod
      JOIN public.folders f ON f.id = cmod.module_id
      JOIN public.sets s ON s.folder_id = f.id
      JOIN public.study_sessions ss ON ss.set_id = s.id
      WHERE cmod.class_id = p_class_id
      AND ss.user_id = p_student_id
      AND ss.score IS NOT NULL
    ), 0) AS avg_score,
    
    -- Dernière activité
    (SELECT MAX(ss.started_at)
     FROM public.class_modules cmod
     JOIN public.folders f ON f.id = cmod.module_id
     JOIN public.sets s ON s.folder_id = f.id
     JOIN public.study_sessions ss ON ss.set_id = s.id
     WHERE cmod.class_id = p_class_id
     AND ss.user_id = p_student_id) AS last_activity
     
  FROM public.class_memberships cm
  JOIN public.profiles p ON p.id = cm.student_id
  WHERE cm.class_id = p_class_id
  AND cm.student_id = p_student_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 3. Stats de tous les élèves de la classe (pour le prof)
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
    p.username,
    p.email,
    p.avatar,
    cm.joined_at,
    -- Total sessions
    COALESCE((SELECT COUNT(*)::INTEGER
     FROM public.class_modules cmod
     JOIN public.folders f ON f.id = cmod.module_id
     JOIN public.sets s ON s.folder_id = f.id
     JOIN public.study_sessions ss ON ss.set_id = s.id
     WHERE cmod.class_id = p_class_id
     AND ss.user_id = p.id), 0) AS total_sessions,
    
    -- Cartes maîtrisées
    COALESCE((SELECT COUNT(DISTINCT cp.flashcard_id)::INTEGER
     FROM public.class_modules cmod
     JOIN public.folders f ON f.id = cmod.module_id
     JOIN public.sets s ON s.folder_id = f.id
     JOIN public.flashcards fc ON fc.set_id = s.id
     JOIN public.card_progress cp ON cp.flashcard_id = fc.id AND cp.user_id = p.id
     WHERE cmod.class_id = p_class_id
     AND cp.repetitions >= 3), 0) AS mastered_cards,
    
    -- Taux de complétion
    COALESCE((
      SELECT 
        CASE 
          WHEN progress.total_cards > 0 THEN
            (progress.mastered_cards::DECIMAL / progress.total_cards::DECIMAL) * 100
          ELSE 0
        END
      FROM (
        SELECT 
          COUNT(DISTINCT fc.id) AS total_cards,
          COUNT(DISTINCT cp.flashcard_id) FILTER (WHERE cp.repetitions >= 3) AS mastered_cards
        FROM public.class_modules cmod
        JOIN public.folders f ON f.id = cmod.module_id
        JOIN public.sets s ON s.folder_id = f.id
        JOIN public.flashcards fc ON fc.set_id = s.id
        LEFT JOIN public.card_progress cp ON cp.flashcard_id = fc.id AND cp.user_id = p.id
        WHERE cmod.class_id = p_class_id
      ) progress
    ), 0) AS completion_rate,
    
    -- Score moyen
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
    (SELECT MAX(ss.started_at)
     FROM public.class_modules cmod
     JOIN public.folders f ON f.id = cmod.module_id
     JOIN public.sets s ON s.folder_id = f.id
     JOIN public.study_sessions ss ON ss.set_id = s.id
     WHERE cmod.class_id = p_class_id
     AND ss.user_id = p.id) AS last_activity
     
  FROM public.class_memberships cm
  JOIN public.profiles p ON p.id = cm.student_id
  WHERE cm.class_id = p_class_id
  ORDER BY cm.joined_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 4. Activité récente de la classe
CREATE OR REPLACE FUNCTION get_class_recent_activity(p_class_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  activity_type TEXT,
  student_id UUID,
  student_username TEXT,
  module_name TEXT,
  set_title TEXT,
  activity_time TIMESTAMPTZ,
  activity_description TEXT
) AS $$
BEGIN
  RETURN QUERY
  -- Joins récents
  SELECT 
    'joined'::TEXT AS activity_type,
    cm.student_id,
    p.username AS student_username,
    NULL::TEXT AS module_name,
    NULL::TEXT AS set_title,
    cm.joined_at AS activity_time,
    'a rejoint la classe'::TEXT AS activity_description
  FROM public.class_memberships cm
  JOIN public.profiles p ON p.id = cm.student_id
  WHERE cm.class_id = p_class_id
  AND cm.joined_at > NOW() - INTERVAL '7 days'
  
  UNION ALL
  
  -- Sessions d'étude terminées
  SELECT 
    'completed'::TEXT AS activity_type,
    ss.user_id AS student_id,
    p.username AS student_username,
    f.name AS module_name,
    s.title AS set_title,
    ss.completed_at AS activity_time,
    'a terminé'::TEXT AS activity_description
  FROM public.class_modules cmod
  JOIN public.folders f ON f.id = cmod.module_id
  JOIN public.sets s ON s.folder_id = f.id
  JOIN public.study_sessions ss ON ss.set_id = s.id
  JOIN public.profiles p ON p.id = ss.user_id
  WHERE cmod.class_id = p_class_id
  AND ss.completed = true
  AND ss.completed_at > NOW() - INTERVAL '7 days'
  
  UNION ALL
  
  -- Cartes maîtrisées (nouveau mastery)
  SELECT 
    'mastered'::TEXT AS activity_type,
    cp.user_id AS student_id,
    p.username AS student_username,
    f.name AS module_name,
    s.title AS set_title,
    cp.updated_at AS activity_time,
    'a maîtrisé une carte'::TEXT AS activity_description
  FROM public.class_modules cmod
  JOIN public.folders f ON f.id = cmod.module_id
  JOIN public.sets s ON s.folder_id = f.id
  JOIN public.flashcards fc ON fc.set_id = s.id
  JOIN public.card_progress cp ON cp.flashcard_id = fc.id
  JOIN public.profiles p ON p.id = cp.user_id
  WHERE cmod.class_id = p_class_id
  AND cp.repetitions = 3
  AND cp.updated_at > NOW() - INTERVAL '7 days'
  
  ORDER BY activity_time DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grants
GRANT EXECUTE ON FUNCTION get_class_stats_real(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_class_student_stats(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_class_students_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_class_recent_activity(UUID, INTEGER) TO authenticated;

-- Success
DO $$
BEGIN
  RAISE NOTICE '✅ Functions created:';
  RAISE NOTICE '   - get_class_stats_real';
  RAISE NOTICE '   - get_class_student_stats';
  RAISE NOTICE '   - get_all_class_students_stats';
  RAISE NOTICE '   - get_class_recent_activity';
END $$;

