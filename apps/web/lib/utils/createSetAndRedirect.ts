import { setsService } from '@/lib/supabase/sets';

/**
 * Creates a new empty set and returns its ID
 * Used to streamline the user flow - create set and go directly to editing
 */
export async function createSetAndRedirect(): Promise<string> {
  try {
    const set = await setsService.create({
      title: 'Set sans titre',
      description: null,
      is_public: false,
      tags: [],
      language: null,
    });
    return set.id;
  } catch (error) {
    console.error('Failed to create set:', error);
    throw error;
  }
}

