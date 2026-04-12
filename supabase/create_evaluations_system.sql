-- ============================================
-- SYSTÈME D'ÉVALUATIONS POUR LES PROFESSEURS
-- ============================================

-- Table principale des évaluations
CREATE TABLE IF NOT EXISTS public.evaluations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  
  -- Paramètres d'évaluation
  mode TEXT NOT NULL CHECK (mode IN ('quiz', 'writing', 'flashcard', 'match')), -- Type de jeu
  duration_minutes INTEGER, -- Durée max par question (en secondes si on veut être précis, ou minutes)
  question_time_limit INTEGER, -- Durée max par question en secondes (NULL = pas de limite)
  randomize_order BOOLEAN DEFAULT FALSE, -- Ordonner les questions aléatoirement
  
  -- Gestion de la durée
  start_time TIMESTAMPTZ, -- Quand l'évaluation a commencé (NULL = pas encore lancée)
  end_time TIMESTAMPTZ, -- Quand l'évaluation se termine (NULL = indéfinie)
  is_active BOOLEAN DEFAULT FALSE, -- L'évaluation est-elle active ?
  is_closed BOOLEAN DEFAULT FALSE, -- L'évaluation est-elle fermée (arrêtée par le prof) ?
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_duration CHECK (
    (end_time IS NULL) OR (start_time IS NULL) OR (end_time > start_time)
  )
);

-- Table de sélection des flashcards pour une évaluation
CREATE TABLE IF NOT EXISTS public.evaluation_flashcards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  evaluation_id UUID NOT NULL REFERENCES public.evaluations(id) ON DELETE CASCADE,
  flashcard_id UUID NOT NULL REFERENCES public.flashcards(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL DEFAULT 0, -- Ordre d'affichage (si randomize_order = false)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(evaluation_id, flashcard_id)
);

-- Table des réponses des étudiants aux évaluations
CREATE TABLE IF NOT EXISTS public.evaluation_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  evaluation_id UUID NOT NULL REFERENCES public.evaluations(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  flashcard_id UUID NOT NULL REFERENCES public.flashcards(id) ON DELETE CASCADE,
  
  -- Réponse de l'étudiant
  answer_text TEXT, -- Pour writing mode
  is_correct BOOLEAN, -- Pour quiz/match mode
  time_spent INTEGER, -- Temps passé en secondes
  points INTEGER DEFAULT 0, -- Points obtenus
  
  -- Métadonnées
  answered_at TIMESTAMPTZ DEFAULT NOW(),
  graded_at TIMESTAMPTZ, -- Quand le prof a noté (pour mode writing)
  graded_by UUID REFERENCES public.profiles(id),
  grade_comment TEXT, -- Commentaire du prof
  
  UNIQUE(evaluation_id, student_id, flashcard_id)
);

-- Table des sessions d'évaluation (pour tracker les tentatives)
CREATE TABLE IF NOT EXISTS public.evaluation_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  evaluation_id UUID NOT NULL REFERENCES public.evaluations(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Progression
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  is_completed BOOLEAN DEFAULT FALSE,
  
  -- Score
  total_questions INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  final_score DECIMAL(5,2), -- Pourcentage
  
  UNIQUE(evaluation_id, student_id) -- Un étudiant ne peut avoir qu'une seule session par évaluation
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_evaluations_class_id ON public.evaluations(class_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_teacher_id ON public.evaluations(teacher_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_is_active ON public.evaluations(is_active);
CREATE INDEX IF NOT EXISTS idx_evaluation_flashcards_eval_id ON public.evaluation_flashcards(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_flashcards_flashcard_id ON public.evaluation_flashcards(flashcard_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_answers_eval_id ON public.evaluation_answers(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_answers_student_id ON public.evaluation_answers(student_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_sessions_eval_id ON public.evaluation_sessions(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_sessions_student_id ON public.evaluation_sessions(student_id);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_evaluations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_evaluations_updated_at ON public.evaluations;
CREATE TRIGGER trigger_update_evaluations_updated_at
  BEFORE UPDATE ON public.evaluations
  FOR EACH ROW
  EXECUTE FUNCTION update_evaluations_updated_at();

-- ============================================
-- RLS POLICIES
-- ============================================

-- Evaluations: Profs peuvent voir/créer/modifier leurs évaluations
DROP POLICY IF EXISTS "Teachers can view their class evaluations" ON public.evaluations;
CREATE POLICY "Teachers can view their class evaluations"
  ON public.evaluations FOR SELECT
  USING (
    teacher_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.class_memberships cm
      WHERE cm.class_id = evaluations.class_id
      AND cm.student_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Teachers can create evaluations for their classes" ON public.evaluations;
CREATE POLICY "Teachers can create evaluations for their classes"
  ON public.evaluations FOR INSERT
  WITH CHECK (
    teacher_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = evaluations.class_id
      AND c.teacher_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Teachers can update their evaluations" ON public.evaluations;
CREATE POLICY "Teachers can update their evaluations"
  ON public.evaluations FOR UPDATE
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

DROP POLICY IF EXISTS "Teachers can delete their evaluations" ON public.evaluations;
CREATE POLICY "Teachers can delete their evaluations"
  ON public.evaluations FOR DELETE
  USING (teacher_id = auth.uid());

-- Evaluation flashcards
DROP POLICY IF EXISTS "Users can view evaluation flashcards" ON public.evaluation_flashcards;
CREATE POLICY "Users can view evaluation flashcards"
  ON public.evaluation_flashcards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.evaluations e
      WHERE e.id = evaluation_flashcards.evaluation_id
      AND (
        e.teacher_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.class_memberships cm
          WHERE cm.class_id = e.class_id
          AND cm.student_id = auth.uid()
        )
      )
    )
  );

DROP POLICY IF EXISTS "Teachers can manage evaluation flashcards" ON public.evaluation_flashcards;
CREATE POLICY "Teachers can manage evaluation flashcards"
  ON public.evaluation_flashcards FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.evaluations e
      WHERE e.id = evaluation_flashcards.evaluation_id
      AND e.teacher_id = auth.uid()
    )
  );

-- Evaluation answers: Étudiants peuvent créer leurs réponses, profs peuvent voir toutes
DROP POLICY IF EXISTS "Students can submit their answers" ON public.evaluation_answers;
CREATE POLICY "Students can submit their answers"
  ON public.evaluation_answers FOR INSERT
  WITH CHECK (
    student_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.evaluations e
      WHERE e.id = evaluation_answers.evaluation_id
      AND e.is_active = true
      AND e.is_closed = false
      AND (e.end_time IS NULL OR e.end_time > NOW())
      AND EXISTS (
        SELECT 1 FROM public.class_memberships cm
        WHERE cm.class_id = e.class_id
        AND cm.student_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Students can view their own answers" ON public.evaluation_answers;
CREATE POLICY "Students can view their own answers"
  ON public.evaluation_answers FOR SELECT
  USING (
    student_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.evaluations e
      WHERE e.id = evaluation_answers.evaluation_id
      AND e.teacher_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Teachers can grade answers" ON public.evaluation_answers;
CREATE POLICY "Teachers can grade answers"
  ON public.evaluation_answers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.evaluations e
      WHERE e.id = evaluation_answers.evaluation_id
      AND e.teacher_id = auth.uid()
    )
  );

-- Evaluation sessions
DROP POLICY IF EXISTS "Users can view evaluation sessions" ON public.evaluation_sessions;
CREATE POLICY "Users can view evaluation sessions"
  ON public.evaluation_sessions FOR SELECT
  USING (
    student_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.evaluations e
      WHERE e.id = evaluation_sessions.evaluation_id
      AND e.teacher_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Students can create their evaluation sessions" ON public.evaluation_sessions;
CREATE POLICY "Students can create their evaluation sessions"
  ON public.evaluation_sessions FOR INSERT
  WITH CHECK (
    student_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.evaluations e
      WHERE e.id = evaluation_sessions.evaluation_id
      AND e.is_active = true
      AND e.is_closed = false
      AND EXISTS (
        SELECT 1 FROM public.class_memberships cm
        WHERE cm.class_id = e.class_id
        AND cm.student_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Students can update their evaluation sessions" ON public.evaluation_sessions;
CREATE POLICY "Students can update their evaluation sessions"
  ON public.evaluation_sessions FOR UPDATE
  USING (student_id = auth.uid());

-- ============================================
-- FUNCTIONS UTILES
-- ============================================

-- Fonction pour lancer une évaluation
CREATE OR REPLACE FUNCTION launch_evaluation(
  p_evaluation_id UUID,
  p_teacher_id UUID,
  p_duration_minutes INTEGER DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_evaluation RECORD;
BEGIN
  -- Vérifier que le prof possède l'évaluation
  SELECT * INTO v_evaluation
  FROM public.evaluations
  WHERE id = p_evaluation_id
  AND teacher_id = p_teacher_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Évaluation introuvable ou vous n''êtes pas le propriétaire';
  END IF;
  
  -- Mettre à jour l'évaluation
  UPDATE public.evaluations
  SET 
    is_active = true,
    is_closed = false,
    start_time = NOW(),
    end_time = CASE 
      WHEN p_duration_minutes IS NOT NULL THEN NOW() + (p_duration_minutes || ' minutes')::INTERVAL
      ELSE NULL
    END,
    updated_at = NOW()
  WHERE id = p_evaluation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour arrêter une évaluation
CREATE OR REPLACE FUNCTION stop_evaluation(
  p_evaluation_id UUID,
  p_teacher_id UUID
)
RETURNS void AS $$
BEGIN
  UPDATE public.evaluations
  SET 
    is_active = false,
    is_closed = true,
    updated_at = NOW()
  WHERE id = p_evaluation_id
  AND teacher_id = p_teacher_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Évaluation introuvable ou vous n''êtes pas le propriétaire';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les flashcards disponibles pour une évaluation (depuis les modules de la classe)
CREATE OR REPLACE FUNCTION get_class_module_flashcards(p_class_id UUID)
RETURNS TABLE (
  flashcard_id UUID,
  question TEXT,
  answer TEXT,
  set_id UUID,
  set_title TEXT,
  module_id UUID,
  module_name TEXT,
  module_color TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fc.id AS flashcard_id,
    COALESCE(fc.front, '') AS question,
    COALESCE(fc.back, '') AS answer,
    s.id AS set_id,
    s.title AS set_title,
    f.id AS module_id,
    f.name AS module_name,
    COALESCE(f.color, '#3b82f6') AS module_color
  FROM public.class_modules cmod
  JOIN public.folders f ON f.id = cmod.module_id
  JOIN public.sets s ON s.folder_id = f.id
  JOIN public.flashcards fc ON fc.set_id = s.id
  WHERE cmod.class_id = p_class_id
  ORDER BY f.name, s.title, COALESCE(fc.order, 0);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grants
GRANT EXECUTE ON FUNCTION launch_evaluation(UUID, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION stop_evaluation(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_class_module_flashcards(UUID) TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Système d''évaluations créé avec succès';
  RAISE NOTICE '   - Table evaluations';
  RAISE NOTICE '   - Table evaluation_flashcards';
  RAISE NOTICE '   - Table evaluation_answers';
  RAISE NOTICE '   - Table evaluation_sessions';
  RAISE NOTICE '   - RLS policies configurées';
  RAISE NOTICE '   - Functions créées';
END $$;

