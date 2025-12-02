import { apiClient } from './client';

export interface Set {
  id: string;
  title: string;
  description?: string;
  isPublic: boolean;
  shareId: string;
  coverImage?: string;
  tags: string[];
  language?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  user: {
    id: string;
    username: string;
    avatar?: string;
  };
  _count: {
    flashcards: number;
  };
  stats?: {
    views: number;
    studies: number;
    favorites: number;
    averageScore: number;
  };
}

export interface CreateSetDto {
  title: string;
  description?: string;
  isPublic?: boolean;
  tags?: string[];
  language?: string;
}

export interface UpdateSetDto {
  title?: string;
  description?: string;
  isPublic?: boolean;
  tags?: string[];
  language?: string;
  coverImage?: string;
}

export interface QuerySetsDto {
  userId?: string;
  isPublic?: boolean;
  search?: string;
  tag?: string;
  page?: number;
  limit?: number;
}

export const setsApi = {
  getAll: async (query?: QuerySetsDto): Promise<{ sets: Set[]; pagination: any }> => {
    const response = await apiClient.get('/sets', { params: query });
    return response.data;
  },

  getOne: async (id: string): Promise<Set & { flashcards: any[] }> => {
    const response = await apiClient.get(`/sets/${id}`);
    return response.data;
  },

  getByShareId: async (shareId: string): Promise<Set & { flashcards: any[] }> => {
    const response = await apiClient.get(`/sets/share/${shareId}`);
    return response.data;
  },

  create: async (data: CreateSetDto): Promise<Set> => {
    const response = await apiClient.post('/sets', data);
    return response.data;
  },

  update: async (id: string, data: UpdateSetDto): Promise<Set> => {
    const response = await apiClient.patch(`/sets/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/sets/${id}`);
  },

  duplicate: async (id: string): Promise<Set> => {
    const response = await apiClient.post(`/sets/${id}/duplicate`);
    return response.data;
  },
};











