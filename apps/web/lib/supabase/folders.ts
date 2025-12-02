/**
 * Service pour gérer les dossiers (folders)
 * 
 * IMPORTANT : Ce service utilise supabaseBrowser, l'instance unique de client Supabase.
 * Cela garantit que toutes les requêtes utilisent la même session utilisateur.
 */

import { supabaseBrowser } from '../supabaseBrowserClient';
import type { Database } from './types';

type Folder = Database['public']['Tables']['folders']['Row'];
type FolderInsert = Database['public']['Tables']['folders']['Insert'];
type FolderUpdate = Database['public']['Tables']['folders']['Update'];

export interface FolderWithSets extends Folder {
  sets: Database['public']['Tables']['sets']['Row'][];
}

export const foldersService = {
  async getAll() {
    // Vérifier la session avant de faire la requête
    const { data: { session } } = await supabaseBrowser.auth.getSession();
    console.log('[Folders service] getAll - current session', session?.user?.id);
    
    if (!session?.user) throw new Error('Not authenticated');
    
    const user = session.user;

    const { data, error } = await supabaseBrowser
      .from('folders')
      .select('*')
      .eq('user_id', user.id)
      .order('order', { ascending: true });

    if (error) throw error;
    return data as Folder[];
  },

  async getOne(id: string) {
    const { data, error } = await supabaseBrowser
      .from('folders')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Folder;
  },

  async getWithSets() {
    // Vérifier la session avant de faire la requête
    const { data: { session } } = await supabaseBrowser.auth.getSession();
    console.log('[Folders service] getWithSets - current session', session?.user?.id);
    
    if (!session?.user) throw new Error('Not authenticated');
    
    const user = session.user;

    // Try to get folders (might fail if table doesn't exist)
    let folders: Folder[] = [];
    try {
      const { data, error } = await supabaseBrowser
        .from('folders')
        .select('*')
        .eq('user_id', user.id)
        .order('order', { ascending: true });
      
      if (!error && data) {
        folders = data;
      }
    } catch (error) {
      // Folders table might not exist yet, continue without folders
      console.warn('Folders table not available:', error);
    }

    // Get all sets
    const { data: sets, error: setsError } = await supabaseBrowser
      .from('sets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (setsError) throw setsError;

    // Group sets by folder (handle case where folder_id might not exist)
    const foldersWithSets: FolderWithSets[] = (folders || []).map((folder) => ({
      ...folder,
      sets: (sets || []).filter((set) => {
        // Check if folder_id exists on set (might be undefined if migration not run)
        return (set as any).folder_id === folder.id;
      }),
    }));

    // Add sets without folder (or sets where folder_id is null/undefined)
    const setsWithoutFolder = (sets || []).filter((set) => {
      const folderId = (set as any).folder_id;
      return !folderId || folderId === null;
    });

    return {
      folders: foldersWithSets,
      setsWithoutFolder,
    };
  },

  async create(folder: Omit<FolderInsert, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    // Vérifier la session avant de faire la requête
    const { data: { session } } = await supabaseBrowser.auth.getSession();
    console.log('[Folders service] create - current session', session?.user?.id);
    
    if (!session?.user) throw new Error('Not authenticated');
    
    const user = session.user;

    // Get max order
    const { data: existingFoldersData } = await supabaseBrowser
      .from('folders')
      .select('order')
      .eq('user_id', user.id)
      .order('order', { ascending: false })
      .limit(1);

    // Type assertion needed because TypeScript may not infer the type correctly from partial select
    const existingFolders = existingFoldersData as Array<{ order: number }> | null;
    
    // Calculate order in a typesafe way
    const latest = existingFolders?.[0];
    const order = typeof latest?.order === 'number' ? latest.order + 1 : 0;

    // Build the insert object with explicit FolderInsert type
    // TypeScript may not infer the type correctly from .from('folders'), so we type it explicitly
    const insertData: FolderInsert = {
      ...folder,
      user_id: user.id,
      order,
    };

    const { data, error } = await supabaseBrowser
      .from('folders')
      .insert(insertData as any)
      .select()
      .single();

    if (error) throw error;
    return data as Folder;
  },

  async update(id: string, updates: FolderUpdate) {
    const { data: { session } } = await supabaseBrowser.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated');
    
    const user = session.user;

    // Type assertion needed because TypeScript may not infer the type correctly from .from('folders')
    const { data, error } = await (supabaseBrowser
      .from('folders') as any)
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data as Folder;
  },

  async delete(id: string) {
    const { data: { session } } = await supabaseBrowser.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated');
    
    const user = session.user;

    // Remove folder_id from all sets in this folder
    // Type assertion needed because TypeScript may not infer the type correctly from .from('sets')
    await (supabaseBrowser
      .from('sets') as any)
      .update({ folder_id: null })
      .eq('folder_id', id)
      .eq('user_id', user.id);

    // Delete folder
    const { error } = await supabaseBrowser
      .from('folders')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
  },

  async addSetToFolder(setId: string, folderId: string | null) {
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

    // If folderId is provided, verify folder ownership
    if (folderId) {
      const { data: folder } = await supabaseBrowser
        .from('folders')
        .select('id')
        .eq('id', folderId)
        .eq('user_id', user.id)
        .single();

      if (!folder) throw new Error('Folder not found or access denied');
    }

    // Type assertion needed because TypeScript may not infer the type correctly from .from('sets')
    const { data, error } = await (supabaseBrowser
      .from('sets') as any)
      .update({ folder_id: folderId })
      .eq('id', setId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

