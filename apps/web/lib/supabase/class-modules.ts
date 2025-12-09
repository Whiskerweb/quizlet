import { createClient } from './client';
import { supabaseBrowser } from '../supabaseBrowserClient';

export const classModulesService = {
  /**
   * Share a module with a class (teacher only)
   */
  async shareModuleWithClass(moduleId: string, classId: string) {
    const supabase = supabaseBrowser;
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('Not authenticated');
    
    const { data, error } = await supabase
      .rpc('share_module_with_class', {
        p_module_id: moduleId,
        p_class_id: classId,
        p_teacher_id: user.id
      });
    
    if (error) throw error;
    return data;
  },

  /**
   * Get all modules in a class
   */
  async getClassModules(classId: string) {
    const supabase = supabaseBrowser;
    
    const { data, error } = await supabase
      .rpc('get_class_modules', { p_class_id: classId });
    
    if (error) throw error;
    return data || [];
  },

  /**
   * Get sets from a specific module in a class
   */
  async getClassModuleSets(classId: string, moduleId: string) {
    const supabase = supabaseBrowser;
    
    const { data, error } = await supabase
      .rpc('get_class_module_sets', {
        p_class_id: classId,
        p_module_id: moduleId
      });
    
    if (error) throw error;
    return data || [];
  },

  /**
   * Remove a module from a class (teacher only)
   */
  async removeModuleFromClass(classId: string, moduleId: string) {
    const supabase = supabaseBrowser;
    
    const { error } = await supabase
      .from('class_modules')
      .delete()
      .eq('class_id', classId)
      .eq('module_id', moduleId);
    
    if (error) throw error;
  },

  /**
   * Get all classes where a module is shared (teacher view)
   */
  async getModuleClasses(moduleId: string) {
    const supabase = supabaseBrowser;
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('Not authenticated');
    
    const { data, error } = await supabase
      .from('class_modules')
      .select(`
        *,
        class:classes(
          id,
          name,
          description,
          class_code,
          color
        )
      `)
      .eq('module_id', moduleId);
    
    if (error) throw error;
    return data || [];
  },

  /**
   * Find which class a set belongs to (for students)
   * Returns the first class found where the student is a member
   */
  async findSetClass(setId: string) {
    const supabase = supabaseBrowser;
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('Not authenticated');
    
    // Use RPC function to find the class
    const { data, error } = await supabase
      .rpc('find_set_class_for_student', {
        p_set_id: setId,
        p_student_id: user.id,
      });
    
    if (error || !data || data.length === 0) {
      return null;
    }
    
    const result = data[0];
    return {
      class_id: result.class_id,
      class: {
        id: result.class_id,
        name: result.class_name,
        description: result.class_description,
        class_code: result.class_code,
        color: result.class_color,
      },
    };
  },
};

