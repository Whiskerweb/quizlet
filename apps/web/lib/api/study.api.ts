import { apiClient } from './client';

export interface StartSessionDto {
  setId: string;
  mode: 'flashcard' | 'quiz' | 'writing' | 'match';
}

export interface AnswerFlashcardDto {
  flashcardId: string;
  isCorrect: boolean;
  timeSpent?: number;
}

export const studyApi = {
  startSession: async (data: StartSessionDto) => {
    const response = await apiClient.post('/study/sessions', data);
    return response.data;
  },

  submitAnswer: async (sessionId: string, data: AnswerFlashcardDto) => {
    const response = await apiClient.post(`/study/sessions/${sessionId}/answers`, data);
    return response.data;
  },

  completeSession: async (sessionId: string) => {
    const response = await apiClient.patch(`/study/sessions/${sessionId}/complete`);
    return response.data;
  },

  getSession: async (sessionId: string) => {
    const response = await apiClient.get(`/study/sessions/${sessionId}`);
    return response.data;
  },
};












