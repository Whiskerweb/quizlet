/**
 * Service pour gérer les flashcards (cardz)
 * 
 * IMPORTANT : Ce service utilise supabaseBrowser, l'instance unique de client Supabase.
 * Cela garantit que toutes les requêtes utilisent la même session utilisateur.
 */

import { supabaseBrowser } from '../supabaseBrowserClient';
import type { Database } from './types';

type Flashcard = Database['public']['Tables']['flashcards']['Row'];
type FlashcardInsert = Database['public']['Tables']['flashcards']['Insert'];
type FlashcardUpdate = Database['public']['Tables']['flashcards']['Update'];

export const flashcardsService = {
  async getAll(setId: string) {
    const { data, error } = await supabaseBrowser
      .from('flashcards')
      .select('*')
      .eq('set_id', setId)
      .order('order', { ascending: true });

    if (error) throw error;
    return data as Flashcard[];
  },

  async getOne(id: string) {
    const { data, error } = await supabaseBrowser
      .from('flashcards')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Flashcard;
  },

  async create(setId: string, flashcard: Omit<FlashcardInsert, 'id' | 'set_id' | 'created_at' | 'updated_at'>) {
    const { data: { session } } = await supabaseBrowser.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated');
    
    const user = session.user;

    // Verify set ownership
    const { data: set, error: setError } = await supabaseBrowser
      .from('sets')
      .select('id')
      .eq('id', setId)
      .eq('user_id', user.id)
      .single();

    if (setError || !set) throw new Error('Set not found or access denied');

    // Get max order
    const { data: existingCards } = await supabaseBrowser
      .from('flashcards')
      .select('order')
      .eq('set_id', setId)
      .order('order', { ascending: false })
      .limit(1);

    const order = existingCards && existingCards.length > 0 ? existingCards[0].order + 1 : 0;

    const { data, error } = await supabaseBrowser
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
    await supabaseBrowser.rpc('increment_flashcard_count', { set_id_param: setId });

    return data as Flashcard;
  },

  async update(id: string, updates: FlashcardUpdate) {
    const { data: { session } } = await supabaseBrowser.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated');

    // Verify ownership through set
    const { data: flashcard } = await supabaseBrowser
      .from('flashcards')
      .select('set_id, sets!inner(user_id)')
      .eq('id', id)
      .single();

    if (!flashcard) throw new Error('Flashcard not found');

    const { data, error } = await supabaseBrowser
      .from('flashcards')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Flashcard;
  },

  async delete(id: string) {
    const { data: { session } } = await supabaseBrowser.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated');

    // Get flashcard to get set_id
    const { data: flashcard } = await supabaseBrowser
      .from('flashcards')
      .select('set_id')
      .eq('id', id)
      .single();

    if (!flashcard) throw new Error('Flashcard not found');

    const { error } = await supabaseBrowser
      .from('flashcards')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Update set stats
    await supabaseBrowser.rpc('decrement_flashcard_count', { set_id_param: flashcard.set_id });
  },

  async reorder(setId: string, flashcardIds: string[]) {
    const { data: { session } } = await supabaseBrowser.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated');
    
    const user = session.user;

    // Verify set ownership
    const { data: set } = await supabaseBrowser
      .from('sets')
      .select('id')
      .eq('id', setId)
      .eq('user_id', user.id)
      .single();

    if (!set) throw new Error('Set not found or access denied');

    // Update order for each flashcard
    const updates = flashcardIds.map((id, index) =>
      supabaseBrowser
        .from('flashcards')
        .update({ order: index })
        .eq('id', id)
        .eq('set_id', setId)
    );

    await Promise.all(updates);
  },

  async import(setId: string, cards: { term: string; definition: string }[]) {
    const { data: { session } } = await supabaseBrowser.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated');
    
    const user = session.user;

    // Verify set ownership
    const { data: set, error: setError } = await supabaseBrowser
      .from('sets')
      .select('id')
      .eq('id', setId)
      .eq('user_id', user.id)
      .single();

    if (setError || !set) throw new Error('Set not found or access denied');

    // Get max order
    const { data: existingCards } = await supabaseBrowser
      .from('flashcards')
      .select('order')
      .eq('set_id', setId)
      .order('order', { ascending: false })
      .limit(1);

    const startOrder = existingCards && existingCards.length > 0 ? existingCards[0].order + 1 : 0;

    // Create all flashcards
    const flashcardsToInsert = cards.map((card, index) => ({
      front: card.term,
      back: card.definition,
      set_id: setId,
      order: startOrder + index,
    }));

    const { data, error } = await supabaseBrowser
      .from('flashcards')
      .insert(flashcardsToInsert)
      .select();

    if (error) throw error;

    // Update set stats (the function automatically counts the flashcards)
    await supabaseBrowser.rpc('increment_flashcard_count', { 
      set_id_param: setId
    });

    return data as Flashcard[];
  },
};


