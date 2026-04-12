import { supabaseBrowser } from '../supabaseBrowserClient';

export interface Evaluation {
  id: string;
  class_id: string;
  teacher_id: string;
  title: string;
  description?: string;
  mode: 'quiz' | 'writing' | 'flashcard' | 'match';
  duration_minutes?: number;
  question_time_limit?: number;
  randomize_order: boolean;
  start_time?: string;
  end_time?: string;
  is_active: boolean;
  is_closed: boolean;
  created_at: string;
  updated_at: string;
}

export interface EvaluationFlashcard {
  id: string;
  evaluation_id: string;
  flashcard_id: string;
  display_order: number;
}

export interface EvaluationAnswer {
  id: string;
  evaluation_id: string;
  student_id: string;
  flashcard_id: string;
  answer_text?: string;
  is_correct?: boolean;
  time_spent?: number;
  points: number;
  answered_at: string;
  graded_at?: string;
  graded_by?: string;
  grade_comment?: string;
}

export interface EvaluationSession {
  id: string;
  evaluation_id: string;
  student_id: string;
  started_at: string;
  completed_at?: string;
  is_completed: boolean;
  total_questions: number;
  correct_answers: number;
  total_points: number;
  final_score?: number;
}

export interface ClassModuleFlashcard {
  flashcard_id: string;
  question: string;
  answer: string;
  set_id: string;
  set_title: string;
  module_id: string;
  module_name: string;
  module_color: string;
}

export interface CreateEvaluationDto {
  class_id: string;
  title: string;
  description?: string;
  mode: 'quiz' | 'writing' | 'flashcard' | 'match';
  duration_minutes?: number;
  question_time_limit?: number;
  randomize_order: boolean;
  flashcard_ids: string[]; // IDs des flashcards sélectionnées
}

export const evaluationsService = {
  /**
   * Créer une évaluation
   */
  async createEvaluation(data: CreateEvaluationDto, teacherId: string) {
    const supabase = supabaseBrowser;

    // Créer l'évaluation
    const { data: evaluation, error: evalError } = await supabase
      .from('evaluations')
      .insert({
        class_id: data.class_id,
        teacher_id: teacherId,
        title: data.title,
        description: data.description,
        mode: data.mode,
        duration_minutes: data.duration_minutes,
        question_time_limit: data.question_time_limit,
        randomize_order: data.randomize_order,
        is_active: false,
        is_closed: false,
      })
      .select()
      .single();

    if (evalError) throw evalError;
    if (!evaluation) throw new Error('Failed to create evaluation');

    // Ajouter les flashcards sélectionnées
    if (data.flashcard_ids.length > 0) {
      const flashcardsToInsert = data.flashcard_ids.map((flashcardId, index) => ({
        evaluation_id: evaluation.id,
        flashcard_id: flashcardId,
        display_order: data.randomize_order ? 0 : index,
      }));

      const { error: flashcardError } = await supabase
        .from('evaluation_flashcards')
        .insert(flashcardsToInsert);

      if (flashcardError) throw flashcardError;
    }

    return evaluation;
  },

  /**
   * Obtenir les évaluations d'une classe
   */
  async getClassEvaluations(classId: string) {
    const supabase = supabaseBrowser;

    const { data, error } = await supabase
      .from('evaluations')
      .select('*')
      .eq('class_id', classId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Obtenir une évaluation par ID
   */
  async getEvaluation(evaluationId: string) {
    const supabase = supabaseBrowser;

    const { data, error } = await supabase
      .from('evaluations')
      .select('*')
      .eq('id', evaluationId)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Obtenir les flashcards disponibles pour une classe (depuis les modules)
   */
  async getClassModuleFlashcards(classId: string): Promise<ClassModuleFlashcard[]> {
    const supabase = supabaseBrowser;

    const { data, error } = await supabase
      .rpc('get_class_module_flashcards', { p_class_id: classId });

    if (error) throw error;
    return data || [];
  },

  /**
   * Obtenir les flashcards d'une évaluation
   * Utilise une fonction RPC pour contourner RLS
   */
  async getEvaluationFlashcards(evaluationId: string) {
    const supabase = supabaseBrowser;

    console.log('[evaluationsService] Getting flashcards for evaluation:', evaluationId);
    
    // Utiliser la fonction RPC qui contourne RLS
    const { data, error } = await supabase
      .rpc('get_evaluation_flashcards', { p_evaluation_id: evaluationId });

    console.log('[evaluationsService] RPC response data:', data);
    console.log('[evaluationsService] RPC error:', error);

    if (error) {
      console.error('[evaluationsService] Error fetching flashcards via RPC:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.log('[evaluationsService] No flashcards found for evaluation');
      return [];
    }

    // Transformer les données pour correspondre au format attendu
    const transformedData = data.map((item: any) => ({
      id: item.id,
      evaluation_id: item.evaluation_id,
      flashcard_id: item.flashcard_id,
      display_order: item.display_order,
      flashcard: {
        id: item.flashcard_id,
        front: item.flashcard_front,
        back: item.flashcard_back,
        set_id: item.flashcard_set_id,
      },
    }));

    console.log('[evaluationsService] Transformed data:', transformedData);
    console.log('[evaluationsService] Valid flashcards:', transformedData.length);
    
    return transformedData;
  },

  /**
   * Lancer une évaluation
   */
  async launchEvaluation(evaluationId: string, teacherId: string, durationMinutes?: number) {
    const supabase = supabaseBrowser;

    const { error } = await supabase
      .rpc('launch_evaluation', {
        p_evaluation_id: evaluationId,
        p_teacher_id: teacherId,
        p_duration_minutes: durationMinutes || null,
      });

    if (error) throw error;
  },

  /**
   * Arrêter une évaluation
   */
  async stopEvaluation(evaluationId: string, teacherId: string) {
    const supabase = supabaseBrowser;

    const { error } = await supabase
      .rpc('stop_evaluation', {
        p_evaluation_id: evaluationId,
        p_teacher_id: teacherId,
      });

    if (error) throw error;
  },

  /**
   * Obtenir les sessions d'évaluation (réponses des étudiants)
   */
  async getEvaluationSessions(evaluationId: string) {
    const supabase = supabaseBrowser;

    const { data, error } = await supabase
      .from('evaluation_sessions')
      .select(`
        *,
        student:profiles!evaluation_sessions_student_id_fkey(
          id,
          username,
          first_name,
          last_name,
          avatar
        )
      `)
      .eq('evaluation_id', evaluationId)
      .order('started_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Obtenir les réponses d'un étudiant pour une évaluation
   */
  async getStudentAnswers(evaluationId: string, studentId: string) {
    const supabase = supabaseBrowser;

    const { data, error } = await supabase
      .from('evaluation_answers')
      .select(`
        *,
        flashcard:flashcards(*)
      `)
      .eq('evaluation_id', evaluationId)
      .eq('student_id', studentId)
      .order('answered_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Obtenir la session d'évaluation d'un étudiant pour une évaluation donnée
   */
  async getStudentEvaluationSession(evaluationId: string, studentId: string) {
    const supabase = supabaseBrowser;

    const { data, error } = await supabase
      .from('evaluation_sessions')
      .select('*')
      .eq('evaluation_id', evaluationId)
      .eq('student_id', studentId)
      .maybeSingle();

    if (error) throw error;
    return data || null;
  },

  /**
   * Noter une réponse (pour mode writing)
   */
  async gradeAnswer(
    answerId: string,
    points: number,
    comment?: string,
    teacherId: string
  ) {
    const supabase = supabaseBrowser;

    const { error } = await supabase
      .from('evaluation_answers')
      .update({
        points,
        graded_at: new Date().toISOString(),
        graded_by: teacherId,
        grade_comment: comment,
      })
      .eq('id', answerId);

    if (error) throw error;
  },

  /**
   * Supprimer une évaluation
   */
  async deleteEvaluation(evaluationId: string, teacherId: string) {
    const supabase = supabaseBrowser;

    // Vérifier la propriété
    const { data: evaluation } = await supabase
      .from('evaluations')
      .select('teacher_id')
      .eq('id', evaluationId)
      .single();

    if (!evaluation || evaluation.teacher_id !== teacherId) {
      throw new Error('You do not own this evaluation');
    }

    const { error } = await supabase
      .from('evaluations')
      .delete()
      .eq('id', evaluationId);

    if (error) throw error;
  },

  /**
   * Démarrer une évaluation pour un étudiant
   * Crée une session d'évaluation et retourne l'ID de la session
   */
  async startEvaluationSession(evaluationId: string, studentId: string) {
    const supabase = supabaseBrowser;

    // Vérifier que l'évaluation est active
    const { data: evaluation, error: evalError } = await supabase
      .from('evaluations')
      .select('*')
      .eq('id', evaluationId)
      .single();

    if (evalError) throw evalError;
    if (!evaluation) throw new Error('Évaluation introuvable');
    if (!evaluation.is_active || evaluation.is_closed) {
      throw new Error('Cette évaluation n\'est pas active');
    }

    // Vérifier que l'étudiant est membre de la classe
    const { data: membership, error: membershipError } = await supabase
      .from('class_memberships')
      .select('*')
      .eq('class_id', evaluation.class_id)
      .eq('student_id', studentId)
      .single();

    if (membershipError || !membership) {
      throw new Error('Vous n\'êtes pas membre de cette classe');
    }

    // Vérifier si une session existe déjà
    const { data: existingSession } = await supabase
      .from('evaluation_sessions')
      .select('*')
      .eq('evaluation_id', evaluationId)
      .eq('student_id', studentId)
      .single();

    if (existingSession) {
      // Si la session existe et n'est pas complétée, on la retourne
      if (!existingSession.is_completed) {
        return existingSession.id;
      }
      throw new Error('Vous avez déjà complété cette évaluation');
    }

    // Obtenir le nombre de questions
    const { data: flashcards, error: flashcardError } = await supabase
      .from('evaluation_flashcards')
      .select('id')
      .eq('evaluation_id', evaluationId);

    if (flashcardError) throw flashcardError;

    // Créer une nouvelle session
    const { data: session, error: sessionError } = await supabase
      .from('evaluation_sessions')
      .insert({
        evaluation_id: evaluationId,
        student_id: studentId,
        total_questions: flashcards?.length || 0,
        started_at: new Date().toISOString(),
        is_completed: false,
      })
      .select()
      .single();

    if (sessionError) throw sessionError;
    return session.id;
  },
};

