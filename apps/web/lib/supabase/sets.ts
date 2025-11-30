import { createClient } from './client';
import type { Database } from './types';

type Set = Database['public']['Tables']['sets']['Row'];
type SetInsert = Database['public']['Tables']['sets']['Insert'];
type SetUpdate = Database['public']['Tables']['sets']['Update'];
type Flashcard = Database['public']['Tables']['flashcards']['Row'];

export interface SetWithFlashcards extends Set {
  flashcards: Flashcard[];
  user?: {
    id: string;
    username: string;
    avatar?: string | null;
  };
}

export const setsService = {
  async getAll(query?: { search?: string; tag?: string; page?: number; limit?: number }) {
    const supabase = createClient();
    let queryBuilder = supabase
      .from('sets')
      .select(`
        *,
        profiles:user_id (
          id,
          username,
          avatar
        )
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (query?.search) {
      queryBuilder = queryBuilder.or(`title.ilike.%${query.search}%,description.ilike.%${query.search}%`);
    }

    if (query?.tag) {
      queryBuilder = queryBuilder.contains('tags', [query.tag]);
    }

    const limit = query?.limit || 20;
    const page = query?.page || 1;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    queryBuilder = queryBuilder.range(from, to);

    const { data, error, count } = await queryBuilder;

    if (error) throw error;

    return {
      sets: data as SetWithFlashcards[],
      pagination: {
        page,
        limit,
        total: count || 0,
      },
    };
  },

  async getOne(id: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('sets')
      .select(`
        *,
        flashcards (*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    
    // Sort flashcards by order
    if (data.flashcards && Array.isArray(data.flashcards)) {
      data.flashcards.sort((a: Flashcard, b: Flashcard) => (a.order || 0) - (b.order || 0));
    }
    
    return data as SetWithFlashcards;
  },

  async getByShareId(shareId: string) {
    const supabase = createClient();
    
    // First, try to get the set without filtering by is_public
    // We'll check is_public in the component
    const { data, error } = await supabase
      .from('sets')
      .select(`
        *,
        flashcards (*),
        profiles:user_id (
          id,
          username,
          avatar
        )
      `)
      .eq('share_id', shareId)
      .maybeSingle(); // Use maybeSingle instead of single to avoid error if not found

    if (error) {
      // Better error handling
      console.error('Error fetching set by shareId:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      
      if (error.code === 'PGRST116' || error.message?.includes('No rows') || error.message?.includes('not found')) {
        throw new Error('Set non trouvé. Vérifiez que le lien de partage est correct.');
      }
      throw error;
    }
    
    if (!data) {
      console.error('No data returned for shareId:', shareId);
      throw new Error('Set non trouvé. Vérifiez que le lien de partage est correct.');
    }
    
    console.log('Set found:', {
      id: data.id,
      title: data.title,
      is_public: data.is_public,
      has_password: !!data.password_hash,
      share_id: data.share_id
    });
    
    // Sort flashcards by order
    if (data.flashcards && Array.isArray(data.flashcards)) {
      data.flashcards.sort((a: Flashcard, b: Flashcard) => (a.order || 0) - (b.order || 0));
    }
    
    // Transform profiles to user format
    const result = {
      ...data,
      user: data.profiles ? {
        id: data.profiles.id,
        username: data.profiles.username,
        avatar: data.profiles.avatar,
      } : undefined,
    };
    
    return result as SetWithFlashcards;
  },

  async getMySets() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('sets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Set[];
  },

  async create(set: Omit<SetInsert, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('sets')
      .insert({
        ...set,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Create set stats
    await supabase.from('set_stats').insert({
      set_id: data.id,
    });

    return data as Set;
  },

  async update(id: string, updates: SetUpdate) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('sets')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data as Set;
  },

  async delete(id: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('sets')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
  },

  async duplicate(id: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get original set
    const original = await this.getOne(id);
    if (!original) throw new Error('Set not found');

    // Create new set
    const { data: newSet, error: setError } = await supabase
      .from('sets')
      .insert({
        title: `${original.title} (Copy)`,
        description: original.description,
        is_public: false,
        tags: original.tags,
        language: original.language,
        user_id: user.id,
      })
      .select()
      .single();

    if (setError) throw setError;

    // Duplicate flashcards
    if (original.flashcards && original.flashcards.length > 0) {
      const flashcards = original.flashcards.map((card, index) => ({
        front: card.front,
        back: card.back,
        image_url: card.image_url,
        audio_url: card.audio_url,
        order: index,
        set_id: newSet.id,
      }));

      const { error: cardsError } = await supabase
        .from('flashcards')
        .insert(flashcards);

      if (cardsError) throw cardsError;
    }

    // Create set stats
    await supabase.from('set_stats').insert({
      set_id: newSet.id,
    });

    return newSet as Set;
  },
};



