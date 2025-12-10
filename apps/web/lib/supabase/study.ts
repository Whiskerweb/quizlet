import { supabaseBrowser } from '../supabaseBrowserClient';

export interface StartSessionDto {
  setId: string;
  mode: 'flashcard' | 'quiz' | 'writing' | 'match';
  shuffle?: boolean;
  startFrom?: number;
  cardOrder?: string[]; // Array of flashcard IDs in order
  sessionState?: any; // Session state for persistence
  forceNew?: boolean; // Force creation of a new session even if one exists
}

export interface AnswerFlashcardDto {
  flashcardId: string;
  isCorrect: boolean;
  timeSpent?: number;
}

export const studyService = {
  async startSession(data: StartSessionDto) {
    // Get session token for authentication
    const { data: { session } } = await supabaseBrowser.auth.getSession();

    if (!session) {
      throw new Error('Not authenticated');
    }

    const response = await fetch('/api/study/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      credentials: 'include', // Include cookies
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to start session' }));
      throw new Error(error.error || 'Failed to start session');
    }

    return response.json();
  },

  async submitAnswer(sessionId: string, data: AnswerFlashcardDto) {
    // Get session token for authentication
    const { data: { session } } = await supabaseBrowser.auth.getSession();

    if (!session) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`/api/study/sessions/${sessionId}/answers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      credentials: 'include', // Include cookies
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to submit answer' }));
      throw new Error(error.error || 'Failed to submit answer');
    }

    return response.json();
  },

  /**
   * Save answer directly to database (for local sessions or when API is unavailable)
   */
  async saveAnswerDirect(setId: string, flashcardId: string, isCorrect: boolean, timeSpent?: number) {
    const { data, error } = await supabaseBrowser.rpc('save_answer_direct', {
      p_set_id: setId,
      p_flashcard_id: flashcardId,
      p_is_correct: isCorrect,
      p_time_spent: timeSpent ?? null,
    } as any);

    if (error) throw error;
    return data;
  },

  async completeSession(sessionId: string) {
    // Get session token for authentication
    const { data: { session } } = await supabaseBrowser.auth.getSession();

    if (!session) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`/api/study/sessions/${sessionId}/complete`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
      credentials: 'include', // Include cookies
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to complete session' }));
      throw new Error(error.error || 'Failed to complete session');
    }

    return response.json();
  },

  async getSession(sessionId: string) {
    console.log('[StudyService] Getting session:', sessionId);

    // Get session token for authentication
    const { data: { session }, error: authError } = await supabaseBrowser.auth.getSession();

    console.log('[StudyService] Auth session:', session ? 'Found' : 'Not found', authError ? `Error: ${authError.message}` : '');

    if (!session) {
      console.error('[StudyService] No auth session found');
      throw new Error('Non authentifié. Veuillez vous reconnecter.');
    }

    console.log('[StudyService] Fetching session with token...');
    const response = await fetch(`/api/study/sessions/${sessionId}`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
      credentials: 'include', // Include cookies
    });

    console.log('[StudyService] Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to get session' }));
      console.error('[StudyService] Error response:', errorData);

      if (response.status === 401 || response.status === 403) {
        throw new Error('Session expirée ou non autorisée. Veuillez vous reconnecter.');
      }

      throw new Error(errorData.error || 'Impossible de récupérer la session');
    }

    const data = await response.json();
    console.log('[StudyService] Session retrieved successfully');
    return data;
  },

  async updateSessionState(sessionId: string, sessionState: any) {
    console.log('[Study] Updating session state for:', sessionId);
    // Only log detailed state in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Study] State preview:', {
        queueLength: sessionState.queue?.length || 0,
        completedCount: sessionState.completedCards?.size || 0,
      });
    }

    // Get session token for authentication
    const { data: { session } } = await supabaseBrowser.auth.getSession();

    if (!session) {
      console.error('[StudyService] No auth session for updateSessionState');
      throw new Error('Not authenticated');
    }

    // Serialize Set objects before sending
    const serializedState = {
      ...sessionState,
      masteredCards: sessionState.masteredCards instanceof Set
        ? Array.from(sessionState.masteredCards)
        : sessionState.masteredCards,
    };

    const response = await fetch(`/api/study/sessions/${sessionId}/state`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      credentials: 'include',
      body: JSON.stringify({ sessionState: serializedState }),
    });

    console.log('[StudyService] Update response status:', response.status);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to update session state' }));
      console.error('[StudyService] Update error:', error);
      throw new Error(error.error || 'Failed to update session state');
    }

    const result = await response.json();
    console.log('[StudyService] ✅ Session state updated successfully');
    return result;
  },

  async getActiveSessions(setId?: string) {
    // Get session token for authentication
    const { data: { session } } = await supabaseBrowser.auth.getSession();

    if (!session) {
      throw new Error('Not authenticated');
    }

    const url = setId
      ? `/api/study/sessions/active?setId=${setId}`
      : '/api/study/sessions/active';

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to get active sessions' }));
      throw new Error(error.error || 'Failed to get active sessions');
    }

    return response.json();
  },
};










