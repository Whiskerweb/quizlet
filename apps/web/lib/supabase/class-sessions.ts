import { supabaseBrowser } from '@/lib/supabaseBrowserClient';

export interface ClassActiveSession {
  session_id: string;
  student_id: string;
  student_username: string;
  student_email: string;
  set_id: string;
  set_title: string;
  mode: string;
  started_at: string;
  shuffle: boolean;
  start_from: number;
  total_cards: number;
  session_state?: any;
  card_order?: string[];
}

export interface StudentQuestionStat {
  flashcard_id: string;
  flashcard_front: string;
  flashcard_back: string;
  set_id: string;
  set_title: string;
  module_name: string;
  total_attempts: number;
  correct_count: number;
  incorrect_count: number;
  success_rate: number;
  last_answered_at: string;
  is_mastered: boolean;
  avg_time_spent: number;
}

export interface ClassQuestionStat {
  flashcard_id: string;
  flashcard_front: string;
  flashcard_back: string;
  set_id: string;
  set_title: string;
  module_name: string;
  total_students_attempted: number;
  total_attempts: number;
  total_correct: number;
  total_incorrect: number;
  avg_success_rate: number;
  students_mastered: number;
  avg_time_spent: number;
}

export const classSessionsService = {
  /**
   * Get all active sessions for students in a class (teacher view)
   */
  async getClassActiveSessions(classId: string): Promise<ClassActiveSession[]> {
    const { data, error } = await supabaseBrowser
      .rpc('get_class_active_sessions', { p_class_id: classId });

    if (error) {
      console.error('[classSessionsService] Error getting class active sessions:', error);
      throw error;
    }

    return (data || []) as ClassActiveSession[];
  },

  /**
   * Get detailed question-by-question stats for a specific student in a class
   */
  async getStudentQuestionStats(
    classId: string,
    studentId: string
  ): Promise<StudentQuestionStat[]> {
    const { data, error } = await supabaseBrowser
      .rpc('get_student_question_stats', {
        p_class_id: classId,
        p_student_id: studentId,
      });

    if (error) {
      console.error('[classSessionsService] Error getting student question stats:', error);
      throw error;
    }

    return (data || []) as StudentQuestionStat[];
  },

  /**
   * Get aggregated question stats for all students in a class
   */
  async getClassQuestionStats(classId: string): Promise<ClassQuestionStat[]> {
    const { data, error } = await supabaseBrowser
      .rpc('get_class_question_stats', { p_class_id: classId });

    if (error) {
      console.error('[classSessionsService] Error getting class question stats:', error);
      throw error;
    }

    return (data || []) as ClassQuestionStat[];
  },
};



