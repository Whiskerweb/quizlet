-- ============================================
-- FIX: get_all_class_students_stats function
-- Description: Use the same logic as get_set_progress for consistency
-- A card is mastered if answered correctly at least 2 times OR has progress with repetitions >= 2
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
    p.username,
    p.email,
    p.avatar,
    cm.joined_at,
    -- Total sessions (all sessions, completed or not)
    COALESCE((SELECT COUNT(*)::INTEGER
     FROM public.class_modules cmod
     JOIN public.folders f ON f.id = cmod.module_id
     JOIN public.sets s ON s.folder_id = f.id
     JOIN public.study_sessions ss ON ss.set_id = s.id
     WHERE cmod.class_id = p_class_id
     AND ss.user_id = p.id), 0) AS total_sessions,
    
    -- Cartes maîtrisées (même logique que get_set_progress)
    -- Une carte est maîtrisée si :
    -- 1. Elle a été répondue correctement au moins 2 fois dans n'importe quelle session
    -- 2. OU elle a un card_progress avec repetitions >= 2
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
    
    -- Taux de complétion (même logique)
    -- On recalcule mastered_cards et total_cards pour le taux
    COALESCE((
      SELECT 
        CASE 
          WHEN total.total_cards > 0 THEN
            (mastered.mastered_count::DECIMAL / total.total_cards::DECIMAL) * 100
          ELSE 0
        END
      FROM (
        -- Total cards
        SELECT COUNT(DISTINCT fc.id)::INTEGER AS total_cards
        FROM public.class_modules cmod
        JOIN public.folders f ON f.id = cmod.module_id
        JOIN public.sets s ON s.folder_id = f.id
        JOIN public.flashcards fc ON fc.set_id = s.id
        WHERE cmod.class_id = p_class_id
      ) total
      CROSS JOIN (
        -- Mastered cards
        SELECT COUNT(DISTINCT fc.id)::INTEGER AS mastered_count
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
      ) mastered
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
    
    -- Dernière activité (dernière session commencée)
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

GRANT EXECUTE ON FUNCTION get_all_class_students_stats(UUID) TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Function get_all_class_students_stats updated successfully!';
  RAISE NOTICE '   ✓ Now uses same logic as get_set_progress';
  RAISE NOTICE '   ✓ Cards mastered if answered correctly >= 2 times OR progress repetitions >= 2';
END $$;

