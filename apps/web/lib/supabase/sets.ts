import { supabaseBrowser } from '../supabaseBrowserClient';
import type { Database } from './types';

type Set = Database['public']['Tables']['sets']['Row'];
type SetInsert = Database['public']['Tables']['sets']['Insert'];
type SetUpdate = Database['public']['Tables']['sets']['Update'];

export interface SetWithFlashcards extends Set {
  flashcards?: Array<{
    id: string;
    front: string;
    back: string;
    image_url: string | null;
    audio_url: string | null;
    order: number;
  }>;
  profiles?: {
    id: string;
    username: string;
    avatar: string | null;
  } | null;
  user?: {
    id: string;
    username: string;
    avatar: string | null;
  } | null;
}

export const setsService = {
  async getOne(id: string): Promise<SetWithFlashcards | null> {
    const { data, error } = await supabaseBrowser
      .from('sets')
      .select(`
        *,
        flashcards (
          id,
          front,
          back,
          image_url,
          audio_url,
          order
        )
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Failed to get set:', error);
      return null;
    }

    return data as SetWithFlashcards | null;
  },

  async create(set: Omit<SetInsert, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'share_id'>): Promise<Set> {
    const { data: { session } } = await supabaseBrowser.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated');

    const insertData: SetInsert = {
      ...set,
      user_id: session.user.id,
    };

    const { data, error } = await (supabaseBrowser.from('sets') as any)
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Failed to create set:', error);
      throw error;
    }

    return data as Set;
  },

  async update(id: string, updates: Partial<SetUpdate>): Promise<Set> {
    const { data: { session } } = await supabaseBrowser.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated');

    const { data, error } = await (supabaseBrowser.from('sets') as any)
      .update(updates)
      .eq('id', id)
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update set:', error);
      throw error;
    }

    return data as Set;
  },

  async delete(id: string): Promise<void> {
    const { data: { session } } = await supabaseBrowser.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated');

    const { error } = await supabaseBrowser
      .from('sets')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Failed to delete set:', error);
      throw error;
    }
  },

  async getPublicSetsWithoutPassword(query?: { 
    search?: string; 
    tag?: string; 
    subject?: string; 
    page?: number; 
    limit?: number 
  }): Promise<{ 
    sets: SetWithFlashcards[]; 
    pagination: { page: number; limit: number; total: number } 
  }> {
    let queryBuilder = supabaseBrowser
      .from('sets')
      .select(`*, profiles:user_id (id, username, avatar)`, { count: 'exact' })
      .eq('is_public', true)
      .is('password_hash', null)
      .order('created_at', { ascending: false });

    if (query?.search) {
      queryBuilder = queryBuilder.or(`title.ilike.%${query.search}%,description.ilike.%${query.search}%`);
    }

    if (query?.subject) {
      queryBuilder = queryBuilder.eq('subject', query.subject);
    }

    if (query?.tag) {
      queryBuilder = queryBuilder.contains('tags', [query.tag]);
    }

    const page = query?.page || 1;
    const limit = query?.limit || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    queryBuilder = queryBuilder.range(from, to);

    const { data, error, count } = await queryBuilder;

    if (error) {
      console.error('Failed to get public sets:', error);
      throw error;
    }

    return {
      sets: (data || []) as SetWithFlashcards[],
      pagination: {
        page,
        limit,
        total: count || 0,
      },
    };
  },
};
