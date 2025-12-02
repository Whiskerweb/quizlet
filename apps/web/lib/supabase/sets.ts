import { supabaseBrowser } from '../supabaseBrowserClient';
import type { Database } from './types';

type Set = Database['public']['Tables']['sets']['Row'];
type SetInsert = Database['public']['Tables']['sets']['Insert'];

export const setsService = {
  async getOne(id: string): Promise<Set | null> {
    const { data, error } = await supabaseBrowser
      .from('sets')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Failed to get set:', error);
      return null;
    }

    return data as Set | null;
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
};
