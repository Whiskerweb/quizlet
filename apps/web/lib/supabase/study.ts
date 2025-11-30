import { createClient } from './client';

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
    const response = await fetch('/api/study/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to start session');
    }

    return response.json();
  },

  async submitAnswer(sessionId: string, data: AnswerFlashcardDto) {
    const response = await fetch(`/api/study/sessions/${sessionId}/answers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to submit answer');
    }

    return response.json();
  },

  async completeSession(sessionId: string) {
    const response = await fetch(`/api/study/sessions/${sessionId}/complete`, {
      method: 'PATCH',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to complete session');
    }

    return response.json();
  },

  async getSession(sessionId: string) {
    const response = await fetch(`/api/study/sessions/${sessionId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get session');
    }

    return response.json();
  },
};




