/**
 * Service pour gérer les sets (Cardz)
 * 
 * IMPORTANT : Ce service utilise supabaseBrowser, l'instance unique de client Supabase.
 * Cela garantit que toutes les requêtes utilisent la même session utilisateur.
 */

import { supabaseBrowser } from '../supabaseBrowserClient';
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
  profiles?: {
    id: string;
    username: string;
    avatar?: string | null;
  };
}

export const setsService = {
  async getAll(query?: { search?: string; tag?: string; page?: number; limit?: number }) {
    let queryBuilder = supabaseBrowser
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

  // Get all public sets without password (for public browsing)
  async getPublicSetsWithoutPassword(query?: { search?: string; tag?: string; subject?: string; page?: number; limit?: number }) {
    let queryBuilder = supabaseBrowser
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
      .is('password_hash', null) // Only sets without password
      .order('created_at', { ascending: false });

    if (query?.search) {
      queryBuilder = queryBuilder.or(`title.ilike.%${query.search}%,description.ilike.%${query.search}%`);
    }

    if (query?.tag) {
      queryBuilder = queryBuilder.contains('tags', [query.tag]);
    }

    if (query?.subject) {
      queryBuilder = queryBuilder.eq('subject', query.subject);
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
    // First try direct query (works for owners and public sets)
    let { data, error } = await supabaseBrowser
      .from('sets')
      .select(`
        *,
        flashcards (*)
      `)
      .eq('id', id)
      .single();

    // If direct query fails (RLS block), try RPC function for class module sets
    if (error && (error.code === 'PGRST116' || error.message?.includes('0 rows'))) {
      const { data: { user } } = await supabaseBrowser.auth.getUser();
      if (user) {
        const { data: rpcData, error: rpcError } = await supabaseBrowser
          .rpc('get_student_class_set', {
            p_set_id: id,
            p_student_id: user.id,
          });

        if (rpcError) {
          // If RPC also fails, throw original error
          throw error;
        }

        // Transform RPC response to match expected format
        const typedData = rpcData as any;
        if (typedData && typedData[0]) {
          const setData = typedData[0];
          
          // Parse flashcards if they're in JSONB format (string or array)
          let flashcards = setData.flashcards || [];
          if (typeof flashcards === 'string') {
            try {
              flashcards = JSON.parse(flashcards);
            } catch (e) {
              console.warn('[setsService] Failed to parse flashcards JSON:', e);
              flashcards = [];
            }
          }
          
          // Ensure flashcards is an array and normalize format
          let normalizedFlashcards: Flashcard[] = [];
          if (Array.isArray(flashcards)) {
            normalizedFlashcards = flashcards.map((fc: any) => ({
              id: fc.id,
              set_id: fc.set_id || setData.id,
              front: fc.front || '',
              back: fc.back || '',
              image_url: fc.image_url || null,
              audio_url: fc.audio_url || null,
              order: typeof fc.order === 'number' ? fc.order : 0,
              created_at: fc.created_at || new Date().toISOString(),
              updated_at: fc.updated_at || new Date().toISOString(),
            } as Flashcard));
            
            // Sort by order
            normalizedFlashcards.sort((a, b) => (a.order || 0) - (b.order || 0));
          }
          
          console.log('[setsService] RPC set loaded:', {
            setId: setData.id,
            title: setData.title,
            flashcardsCount: normalizedFlashcards.length,
            sampleCard: normalizedFlashcards[0] ? {
              id: normalizedFlashcards[0].id,
              hasFront: !!normalizedFlashcards[0].front,
              hasBack: !!normalizedFlashcards[0].back,
              order: normalizedFlashcards[0].order,
            } : null,
          });
          
          return {
            id: setData.id,
            title: setData.title,
            description: setData.description,
            is_public: setData.is_public,
            tags: setData.tags,
            language: setData.language,
            user_id: setData.user_id,
            folder_id: setData.folder_id,
            created_at: setData.created_at,
            updated_at: setData.updated_at,
            flashcards: normalizedFlashcards,
          } as SetWithFlashcards;
        }
      }
    }

    if (error) throw error;
    
    // Type assertion needed because TypeScript may not infer the type correctly from select with relations
    const typedData = data as any;
    
    // Sort flashcards by order
    if (typedData.flashcards && Array.isArray(typedData.flashcards)) {
      typedData.flashcards.sort((a: Flashcard, b: Flashcard) => (a.order || 0) - (b.order || 0));
    }
    
    return typedData as SetWithFlashcards;
  },

  /**
   * Get progress for a set (for students)
   */
  async getProgress(setId: string) {
    const { data: { user } } = await supabaseBrowser.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    console.log('[setsService] Getting progress for set:', setId, 'user:', user.id);
    const { data, error } = await supabaseBrowser
      .rpc('get_set_progress', {
        p_set_id: setId,
        p_user_id: user.id,
      });

    if (error) {
      console.error('[setsService] Error getting progress:', error);
      throw error;
    }

    const result = data && data[0] ? data[0] : { total_cards: 0, mastered_cards: 0, progress_percentage: 0 };
    console.log('[setsService] Progress result:', result);
    return result;
  },

  async getByShareId(shareId: string) {
    // Use API route for better server-side handling and RLS compatibility
    try {
      // Use absolute URL for production compatibility
      const baseUrl = typeof window !== 'undefined' 
        ? window.location.origin 
        : process.env.NEXT_PUBLIC_APP_URL || '';
      
      const apiUrl = `${baseUrl}/api/sets/share/${shareId}`;
      console.log('[Client] Fetching set from API:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store', // Always fetch fresh data
      });

      console.log('[Client] API response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[Client] API error response:', errorData);
        
        if (response.status === 404) {
          throw new Error('Set non trouvé. Vérifiez que le lien de partage est correct.');
        }
        if (response.status === 403) {
          throw new Error('Ce set n\'est pas public.');
        }
        throw new Error(errorData.error || errorData.details || 'Erreur lors du chargement du set');
      }

      const data = await response.json();
      
      console.log('[Client] Set loaded from API:', {
        id: data.id,
        title: data.title,
        is_public: data.is_public,
        has_password: !!data.password_hash,
        share_id: data.share_id
      });
      
      return data as SetWithFlashcards;
    } catch (error: any) {
      console.error('[Client] Error fetching set by shareId via API:', error);
      console.error('[Client] Error message:', error.message);
      console.error('[Client] Error stack:', error.stack);
      throw error;
    }
  },

  async getMySets() {
    // Vérifier la session avant de faire la requête
    const { data: { session } } = await supabaseBrowser.auth.getSession();
    console.log('[Sets service] getMySets - current session', session?.user?.id);
    
    if (!session?.user) throw new Error('Not authenticated');
    
    const user = session.user;

    const { data, error } = await supabaseBrowser
      .from('sets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Set[];
  },

  async create(set: Omit<SetInsert, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    // Vérifier la session avant de faire la requête
    const { data: { session } } = await supabaseBrowser.auth.getSession();
    console.log('[Sets service] create - current session', session?.user?.id);
    
    if (!session?.user) throw new Error('Not authenticated');
    
    const user = session.user;

    // Build the insert object with explicit SetInsert type
    // TypeScript may not infer the type correctly from .from('sets'), so we type it explicitly
    const insertData: SetInsert = {
      ...set,
      user_id: user.id,
    };

    const { data, error } = await supabaseBrowser
      .from('sets')
      .insert(insertData as any)
      .select()
      .single();

    if (error) throw error;

    // Type assertion needed because TypeScript may not infer the type correctly
    const typedData = data as Set;

    // Create set stats
    // Type assertion needed because TypeScript may not infer the type correctly from .from('set_stats')
    await (supabaseBrowser.from('set_stats') as any).insert({
      set_id: typedData.id,
    });

    return data as Set;
  },

  async update(id: string, updates: SetUpdate) {
    const { data: { session } } = await supabaseBrowser.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated');
    
    const user = session.user;

    // Type assertion needed because TypeScript may not infer the type correctly from .from('sets')
    const { data, error } = await (supabaseBrowser
      .from('sets') as any)
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data as Set;
  },

  async delete(id: string) {
    const { data: { session } } = await supabaseBrowser.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated');
    
    const user = session.user;

    const { error } = await supabaseBrowser
      .from('sets')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
  },

  async duplicate(id: string) {
    const { data: { session } } = await supabaseBrowser.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated');
    
    const user = session.user;

    // Get original set
    const original = await this.getOne(id);
    if (!original) throw new Error('Set not found');

    // Create new set
    // Build the insert object with explicit SetInsert type
    const newSetData: SetInsert = {
      title: `${original.title} (Copy)`,
      description: original.description,
      is_public: false,
      tags: original.tags,
      language: original.language,
      user_id: user.id,
    };

    const { data: newSet, error: setError } = await supabaseBrowser
      .from('sets')
      .insert(newSetData as any)
      .select()
      .single();

    if (setError) throw setError;

    // Type assertion needed because TypeScript may not infer the type correctly
    const typedNewSet = newSet as Set;

    // Duplicate flashcards
    if (original.flashcards && original.flashcards.length > 0) {
      const flashcards = original.flashcards.map((card, index) => ({
        front: card.front,
        back: card.back,
        image_url: card.image_url,
        audio_url: card.audio_url,
        order: index,
        set_id: typedNewSet.id,
      }));

      // Type assertion needed because TypeScript may not infer the type correctly from .from('flashcards')
      const { error: cardsError } = await supabaseBrowser
        .from('flashcards')
        .insert(flashcards as any);

      if (cardsError) throw cardsError;
    }

    // Create set stats
    // Type assertion needed because TypeScript may not infer the type correctly from .from('set_stats')
    await (supabaseBrowser.from('set_stats') as any).insert({
      set_id: typedNewSet.id,
    });

    return newSet as Set;
  },
};



