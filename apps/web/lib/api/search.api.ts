import { apiClient } from './client';
import { Set } from './sets.api';

export interface SearchParams {
  q: string;
  limit?: number;
  offset?: number;
}

export const searchApi = {
  search: async (params: SearchParams): Promise<{ sets: Set[]; pagination: any }> => {
    const response = await apiClient.get('/search', { params });
    return response.data;
  },
};

