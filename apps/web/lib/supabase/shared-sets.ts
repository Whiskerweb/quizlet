/**
 * Service pour gérer les sets partagés
 * 
 * IMPORTANT : Ce service utilise supabaseBrowser, l'instance unique de client Supabase.
 * Cela garantit que toutes les requêtes utilisent la même session utilisateur.
 */

import { supabaseBrowser } from '../supabaseBrowserClient';
import type { Database } from './types';

// Simple hash function using Web Crypto API (more secure than simple hash)
// Note: In production, password hashing should be done server-side with bcrypt
async function hashPasswordAsyncInternal(password: string): Promise<string> {
  if (typeof window === 'undefined') {
    // Server-side: use a simple hash for now
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }
  
  // Client-side: use Web Crypto API
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Synchronous version for compatibility
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

type SharedSet = Database['public']['Tables']['shared_sets']['Row'];
type SharedSetInsert = Database['public']['Tables']['shared_sets']['Insert'];
type Set = Database['public']['Tables']['sets']['Row'];

export interface SharedSetWithDetails extends SharedSet {
  set: Set & {
    profiles: {
      username: string;
      avatar: string | null;
    };
  };
}

// Hash password (synchronous version for compatibility)
export function hashPassword(password: string): string {
  // Use a simple hash for now - in production this should be done server-side with bcrypt
  return simpleHash(password);
}

// Async version using Web Crypto API (more secure)
export async function hashPasswordAsync(password: string): Promise<string> {
  return await hashPasswordAsyncInternal(password);
}

// Verify password
export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export const sharedSetsService = {
  // Get all shared sets for the current user
  async getMySharedSets(): Promise<SharedSetWithDetails[]> {
    const { data: { session } } = await supabaseBrowser.auth.getSession();
    if (!session?.user) {
      throw new Error('User not authenticated');
    }
    
    const user = session.user;

    const { data, error } = await supabaseBrowser
      .from('shared_sets')
      .select(`
        *,
        set:sets!inner(
          *,
          profiles:profiles!sets_user_id_fkey(
            username,
            avatar
          )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching shared sets:', error);
      throw error;
    }

    // Transform the data to match our interface
    const transformed = (data || []).map((item: any) => ({
      ...item,
      set: {
        ...item.set,
        profiles: item.set.profiles || { username: 'Unknown', avatar: null },
      },
    }));

    return transformed as SharedSetWithDetails[];
  },

  // Share a set with the current user (after password verification)
  async shareSet(setId: string, password?: string): Promise<SharedSet> {
    const { data: { session } } = await supabaseBrowser.auth.getSession();
    if (!session?.user) {
      throw new Error('User not authenticated');
    }
    
    const user = session.user;

    // First, check if the set exists and verify password if needed
    const { data: set, error: setError } = await supabaseBrowser
      .from('sets')
      .select('*')
      .eq('id', setId)
      .single();

    if (setError || !set) {
      throw new Error('Set not found');
    }

    // Check if set is public
    if (!set.is_public) {
      throw new Error('Set is not public');
    }

    // Verify password if set has one
    if (set.password_hash) {
      if (!password) {
        throw new Error('Password required');
      }
      if (!verifyPassword(password, set.password_hash)) {
        throw new Error('Incorrect password');
      }
    }

    // Check if already shared
    const { data: existing } = await supabaseBrowser
      .from('shared_sets')
      .select('*')
      .eq('set_id', setId)
      .eq('user_id', user.id)
      .single();

    if (existing) {
      return existing;
    }

    // Create shared set entry
    const { data, error } = await supabaseBrowser
      .from('shared_sets')
      .insert({
        set_id: setId,
        user_id: user.id,
        shared_by_user_id: set.user_id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Remove a shared set
  async removeSharedSet(sharedSetId: string): Promise<void> {
    const { data: { session } } = await supabaseBrowser.auth.getSession();
    if (!session?.user) {
      throw new Error('User not authenticated');
    }
    
    const user = session.user;

    const { error } = await supabaseBrowser
      .from('shared_sets')
      .delete()
      .eq('id', sharedSetId)
      .eq('user_id', user.id);

    if (error) throw error;
  },

  // Check if a set requires a password
  async checkSetPassword(setId: string): Promise<boolean> {
    const { data, error } = await supabaseBrowser
      .from('sets')
      .select('password_hash')
      .eq('id', setId)
      .single();

    if (error || !data) {
      return false;
    }

    return !!data.password_hash;
  },

  // Check if user already has access to a set
  async hasAccess(setId: string): Promise<boolean> {
    const { data: { session } } = await supabaseBrowser.auth.getSession();
    if (!session?.user) {
      return false;
    }
    
    const user = session.user;

    const { data } = await supabaseBrowser
      .from('shared_sets')
      .select('id')
      .eq('set_id', setId)
      .eq('user_id', user.id)
      .single();

    return !!data;
  },

  // Get users who have added a set (for set owners)
  async getSetUsers(setId: string): Promise<Array<{
    id: string;
    username: string;
    avatar: string | null;
    added_at: string;
  }>> {
    const { data: { session } } = await supabaseBrowser.auth.getSession();
    if (!session?.user) {
      throw new Error('User not authenticated');
    }
    
    const user = session.user;

    // Verify user owns the set
    const { data: setData } = await supabaseBrowser
      .from('sets')
      .select('user_id')
      .eq('id', setId)
      .single();

    if (!setData || setData.user_id !== user.id) {
      throw new Error('You do not own this set');
    }

    const { data, error } = await supabaseBrowser
      .from('shared_sets')
      .select(`
        user_id,
        created_at,
        profiles:profiles!shared_sets_user_id_fkey (
          username,
          avatar
        )
      `)
      .eq('set_id', setId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching set users:', error);
      throw error;
    }

    return (data || []).map((item: any) => ({
      id: item.user_id,
      username: item.profiles?.username || 'Unknown',
      avatar: item.profiles?.avatar || null,
      added_at: item.created_at,
    }));
  },
};

