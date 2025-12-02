import { supabaseBrowser } from '../supabaseBrowserClient';

export interface StartSessionDto {
  setId: string;
  mode: 'flashcard' | 'quiz' | 'writing' | 'match';
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
    // Get session token for authentication
    const { data: { session } } = await supabaseBrowser.auth.getSession();
    
    if (!session) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`/api/study/sessions/${sessionId}`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
      credentials: 'include', // Include cookies
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to get session' }));
      throw new Error(error.error || 'Failed to get session');
    }

    return response.json();
  },
};










