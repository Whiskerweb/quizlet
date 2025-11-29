import { apiClient } from './client';

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  imageUrl?: string;
  audioUrl?: string;
  order: number;
  setId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFlashcardDto {
  front: string;
  back: string;
  imageUrl?: string;
  audioUrl?: string;
  order?: number;
}

export interface UpdateFlashcardDto {
  front?: string;
  back?: string;
  imageUrl?: string;
  audioUrl?: string;
  order?: number;
}

export const flashcardsApi = {
  getAll: async (setId: string): Promise<Flashcard[]> => {
    const response = await apiClient.get(`/sets/${setId}/flashcards`);
    return response.data;
  },

  getOne: async (id: string): Promise<Flashcard> => {
    const response = await apiClient.get(`/flashcards/${id}`);
    return response.data;
  },

  create: async (setId: string, data: CreateFlashcardDto): Promise<Flashcard> => {
    const response = await apiClient.post(`/sets/${setId}/flashcards`, data);
    return response.data;
  },

  update: async (id: string, data: UpdateFlashcardDto): Promise<Flashcard> => {
    const response = await apiClient.patch(`/flashcards/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/flashcards/${id}`);
  },

  reorder: async (setId: string, flashcardIds: string[]): Promise<void> => {
    await apiClient.patch(`/sets/${setId}/flashcards/reorder`, { flashcardIds });
  },
};


