import { createClient } from './client';
import type { Database } from './types';

type Folder = Database['public']['Tables']['folders']['Row'];
type FolderInsert = Database['public']['Tables']['folders']['Insert'];
type FolderUpdate = Database['public']['Tables']['folders']['Update'];

export interface FolderWithSets extends Folder {
  sets: Database['public']['Tables']['sets']['Row'][];
}

export const foldersService = {
  async getAll() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .eq('user_id', user.id)
      .order('order', { ascending: true });

    if (error) throw error;
    return data as Folder[];
  },

  async getOne(id: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Folder;
  },

  async getWithSets() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Try to get folders (might fail if table doesn't exist)
    let folders: Folder[] = [];
    try {
      const { data, error } = await supabase
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
    const { data: sets, error: setsError } = await supabase
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
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get max order
    const { data: existingFolders } = await supabase
      .from('folders')
      .select('order')
      .eq('user_id', user.id)
      .order('order', { ascending: false })
      .limit(1);

    const order = existingFolders && existingFolders.length > 0 ? existingFolders[0].order + 1 : 0;

    const { data, error } = await supabase
      .from('folders')
      .insert({
        ...folder,
        user_id: user.id,
        order,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Folder;
  },

  async update(id: string, updates: FolderUpdate) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('folders')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data as Folder;
  },

  async delete(id: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Remove folder_id from all sets in this folder
    await supabase
      .from('sets')
      .update({ folder_id: null })
      .eq('folder_id', id)
      .eq('user_id', user.id);

    // Delete folder
    const { error } = await supabase
      .from('folders')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
  },

  async addSetToFolder(setId: string, folderId: string | null) {
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

    // If folderId is provided, verify folder ownership
    if (folderId) {
      const { data: folder } = await supabase
        .from('folders')
        .select('id')
        .eq('id', folderId)
        .eq('user_id', user.id)
        .single();

      if (!folder) throw new Error('Folder not found or access denied');
    }

    const { data, error } = await supabase
      .from('sets')
      .update({ folder_id: folderId })
      .eq('id', setId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

