import { createClient } from './client';
import type { Database } from './types';

type Flashcard = Database['public']['Tables']['flashcards']['Row'];
type FlashcardInsert = Database['public']['Tables']['flashcards']['Insert'];
type FlashcardUpdate = Database['public']['Tables']['flashcards']['Update'];

export const flashcardsService = {
  async getAll(setId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('set_id', setId)
      .order('order', { ascending: true });

    if (error) throw error;
    return data as Flashcard[];
  },

  async getOne(id: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Flashcard;
  },

  async create(setId: string, flashcard: Omit<FlashcardInsert, 'id' | 'set_id' | 'created_at' | 'updated_at'>) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Verify set ownership
    const { data: set, error: setError } = await supabase
      .from('sets')
      .select('id')
      .eq('id', setId)
      .eq('user_id', user.id)
      .single();

    if (setError || !set) throw new Error('Set not found or access denied');

    // Get max order
    const { data: existingCards } = await supabase
      .from('flashcards')
      .select('order')
      .eq('set_id', setId)
      .order('order', { ascending: false })
      .limit(1);

    const order = existingCards && existingCards.length > 0 ? existingCards[0].order + 1 : 0;

    const { data, error } = await supabase
      .from('flashcards')
      .insert({
        ...flashcard,
        set_id: setId,
        order,
      })
      .select()
      .single();

    if (error) throw error;

    // Update set stats
    await supabase.rpc('increment_flashcard_count', { set_id_param: setId });

    return data as Flashcard;
  },

  async update(id: string, updates: FlashcardUpdate) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Verify ownership through set
    const { data: flashcard } = await supabase
      .from('flashcards')
      .select('set_id, sets!inner(user_id)')
      .eq('id', id)
      .single();

    if (!flashcard) throw new Error('Flashcard not found');

    const { data, error } = await supabase
      .from('flashcards')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Flashcard;
  },

  async delete(id: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get flashcard to get set_id
    const { data: flashcard } = await supabase
      .from('flashcards')
      .select('set_id')
      .eq('id', id)
      .single();

    if (!flashcard) throw new Error('Flashcard not found');

    const { error } = await supabase
      .from('flashcards')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Update set stats
    await supabase.rpc('decrement_flashcard_count', { set_id_param: flashcard.set_id });
  },

  async reorder(setId: string, flashcardIds: string[]) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Verify set ownership
    const { data: set } = await supabase
      .from('sets')
      .select('id')
      .eq('id', setId)
      .eq('user_id', user.id)
      .single();

    if (!set) throw new Error('Set not found or access denied');

    // Update order for each flashcard
    const updates = flashcardIds.map((id, index) =>
      supabase
        .from('flashcards')
        .update({ order: index })
        .eq('id', id)
        .eq('set_id', setId)
    );

    await Promise.all(updates);
  },
};

