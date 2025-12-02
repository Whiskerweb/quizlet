import { supabaseBrowser } from '../supabaseBrowserClient';
import type { Database } from './types';

type Flashcard = Database['public']['Tables']['flashcards']['Row'];
type FlashcardInsert = Database['public']['Tables']['flashcards']['Insert'];
type FlashcardUpdate = Database['public']['Tables']['flashcards']['Update'];

export type { Flashcard };

export const flashcardsService = {
  async getBySetId(setId: string): Promise<Flashcard[]> {
    const { data, error } = await supabaseBrowser
      .from('flashcards')
      .select('*')
      .eq('set_id', setId)
      .order('order', { ascending: true });

    if (error) {
      console.error('Failed to get flashcards:', error);
      throw error;
    }

    return (data || []) as Flashcard[];
  },

  async getOne(id: string): Promise<Flashcard | null> {
    const { data, error } = await supabaseBrowser
      .from('flashcards')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Failed to get flashcard:', error);
      return null;
    }

    return data as Flashcard | null;
  },

  async create(
    setId: string,
    flashcard: Omit<FlashcardInsert, 'id' | 'set_id' | 'order' | 'created_at' | 'updated_at'>
  ): Promise<Flashcard> {
    const { data: { session } } = await supabaseBrowser.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated');

    // Get the last order for this set
    const { data: existingCardsData } = await supabaseBrowser
      .from('flashcards')
      .select('order')
      .eq('set_id', setId)
      .order('order', { ascending: false })
      .limit(1);

    const existingCards = existingCardsData as Array<{ order: number }> | null;
    const latest = existingCards?.[0];
    const order = typeof latest?.order === 'number' ? latest.order + 1 : 0;

    const insertData: FlashcardInsert = {
      ...flashcard,
      set_id: setId,
      order,
    };

    const { data, error } = await (supabaseBrowser.from('flashcards') as any)
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Failed to create flashcard:', error);
      throw error;
    }

    // Update set stats (increment flashcard count)
    try {
      await (supabaseBrowser.rpc as any)('increment_flashcard_count', { set_id_param: setId });
    } catch (rpcError) {
      console.warn('Failed to increment flashcard count:', rpcError);
      // Non-blocking error
    }

    return data as Flashcard;
  },

  async update(id: string, updates: FlashcardUpdate): Promise<Flashcard> {
    const { data: { session } } = await supabaseBrowser.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated');

    const { data, error } = await (supabaseBrowser.from('flashcards') as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update flashcard:', error);
      throw error;
    }

    return data as Flashcard;
  },

  async delete(id: string): Promise<void> {
    const { data: { session } } = await supabaseBrowser.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated');

    // Get the flashcard to know which set it belongs to (for decrementing count)
    const { data: flashcard } = await supabaseBrowser
      .from('flashcards')
      .select('set_id')
      .eq('id', id)
      .single();

    const { error } = await supabaseBrowser
      .from('flashcards')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Failed to delete flashcard:', error);
      throw error;
    }

    // Update set stats (decrement flashcard count)
    if (flashcard?.set_id) {
      try {
        await (supabaseBrowser.rpc as any)('decrement_flashcard_count', { set_id_param: flashcard.set_id });
      } catch (rpcError) {
        console.warn('Failed to decrement flashcard count:', rpcError);
        // Non-blocking error
      }
    }
  },

  async reorder(setId: string, orderedIds: string[]): Promise<void> {
    const { data: { session } } = await supabaseBrowser.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated');

    // Update the order field based on position in orderedIds
    for (let index = 0; index < orderedIds.length; index++) {
      const id = orderedIds[index];
      const { error } = await (supabaseBrowser.from('flashcards') as any)
        .update({ order: index })
        .eq('id', id)
        .eq('set_id', setId);

      if (error) {
        console.error(`Failed to update order for flashcard ${id}:`, error);
        throw error;
      }
    }
  },
};
