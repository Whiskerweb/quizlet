import { createClient } from './client';
import { supabaseBrowser } from '../supabaseBrowserClient';
import type { Database } from './types';

type Class = Database['public']['Tables']['classes']['Row'];
type ClassInsert = Database['public']['Tables']['classes']['Insert'];
type ClassUpdate = Database['public']['Tables']['classes']['Update'];

export const classesService = {
  /**
   * Create a new class (teacher only)
   */
  async createClass(data: Omit<ClassInsert, 'id' | 'teacher_id' | 'created_at' | 'updated_at' | 'class_code'>, userId?: string) {
    // Use the shared browser client instead of creating a new one
    const supabase = supabaseBrowser;
    
    console.log('[classesService] Getting user...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    console.log('[classesService] User:', user?.id, 'Email:', user?.email);
    console.log('[classesService] User error:', userError);
    
    // Use provided userId as fallback if getUser fails
    const finalUserId = user?.id || userId;
    
    if (!finalUserId) {
      console.error('[classesService] No user found!');
      throw new Error('Not authenticated - no user session');
    }
    
    console.log('[classesService] Calling create_class_safe with:', {
      name: data.name,
      description: data.description,
      color: data.color || '#3b82f6',
      teacher_id: finalUserId
    });
    
    const { data: classData, error } = await supabase
      .rpc('create_class_safe', {
        p_name: data.name,
        p_description: data.description || null,
        p_color: data.color || '#3b82f6',
        p_teacher_id: finalUserId
      });
    
    console.log('[classesService] Response:', classData);
    console.log('[classesService] Error:', error);
    
    if (error) {
      console.error('[classesService] Error creating class:', error);
      throw new Error(error.message || 'Failed to create class');
    }
    
    return classData?.[0] || null;
  },

  /**
   * Get all classes for the current teacher
   */
  async getMyClasses(userId?: string) {
    const supabase = supabaseBrowser;
    const { data: { user } } = await supabase.auth.getUser();
    
    const finalUserId = user?.id || userId;
    
    if (!finalUserId) throw new Error('Not authenticated');
    
    // Use RPC function for better performance
    const { data, error } = await supabase
      .rpc('get_teacher_classes', { p_teacher_id: finalUserId });
    
    if (error) throw error;
    return data || [];
  },

  /**
   * Get all classes the current student is a member of
   */
  async getStudentClasses(userId?: string) {
    const supabase = supabaseBrowser;
    const { data: { user } } = await supabase.auth.getUser();
    
    const finalUserId = user?.id || userId;
    
    if (!finalUserId) throw new Error('Not authenticated');
    
    // Use RPC function
    const { data, error } = await supabase
      .rpc('get_student_classes', { p_student_id: finalUserId });
    
    if (error) throw error;
    return data || [];
  },

  /**
   * Get a single class by ID
   */
  async getClass(classId: string) {
    const supabase = supabaseBrowser;
    
    const { data, error } = await supabase
      .from('classes')
      .select(`
        *,
        teacher:profiles!classes_teacher_id_fkey(
          id,
          username,
          first_name,
          last_name,
          avatar
        )
      `)
      .eq('id', classId)
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Update a class (teacher only)
   */
  async updateClass(classId: string, data: ClassUpdate) {
    const supabase = supabaseBrowser;
    
    const { data: classData, error } = await supabase
      .from('classes')
      .update(data)
      .eq('id', classId)
      .select()
      .single();
    
    if (error) throw error;
    return classData;
  },

  /**
   * Delete a class (teacher only)
   */
  async deleteClass(classId: string, userId?: string) {
    const supabase = supabaseBrowser;
    const { data: { user } } = await supabase.auth.getUser();
    
    const finalUserId = user?.id || userId;
    
    if (!finalUserId) throw new Error('Not authenticated');
    
    const { data, error } = await supabase
      .rpc('delete_class_safe', {
        p_class_id: classId,
        p_teacher_id: finalUserId
      });
    
    if (error) throw error;
    return data;
  },

  /**
   * Get a single class by ID
   */
  async getClass(classId: string) {
    console.log('[classesService] getClass - classId:', classId);
    
    // Check current session
    const { data: { session } } = await supabaseBrowser.auth.getSession();
    console.log('[classesService] getClass - session user:', session?.user?.id);
    
    const { data, error } = await supabaseBrowser
      .from('classes')
      .select('*')
      .eq('id', classId)
      .single();
    
    console.log('[classesService] getClass - data:', data);
    console.log('[classesService] getClass - error:', error);
    
    if (error) throw error;
    return data;
  },

  /**
   * Get students in a class
   */
  async getClassStudents(classId: string) {
    const { data, error } = await supabaseBrowser
      .from('class_memberships')
      .select(`
        student_id,
        joined_at,
        profiles:student_id (
          username,
          email,
          avatar_url
        )
      `)
      .eq('class_id', classId)
      .order('joined_at', { ascending: false });
    
    if (error) throw error;
    
    // Transform the data
    return (data || []).map((membership: any) => ({
      member_id: membership.student_id,
      username: membership.profiles?.username || 'Anonyme',
      email: membership.profiles?.email || '',
      avatar: membership.profiles?.avatar_url || null,
      joined_at: membership.joined_at,
    }));
  },

  /**
   * Remove a student from a class (teacher only)
   */
  async removeStudent(classId: string, studentId: string) {
    const supabase = supabaseBrowser;
    
    const { error } = await supabase
      .from('class_memberships')
      .delete()
      .eq('class_id', classId)
      .eq('student_id', studentId);
    
    if (error) throw error;
  },

  /**
   * Join a class using a class code (student only)
   */
  async joinClassByCode(classCode: string) {
    const supabase = supabaseBrowser;
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    console.log('[classesService] joinClassByCode - user:', user?.id);
    console.log('[classesService] joinClassByCode - code:', classCode);
    
    if (!user) {
      console.error('[classesService] Not authenticated:', authError);
      throw new Error('Not authenticated');
    }
    
    const { data, error } = await supabase
      .rpc('join_class_by_code', {
        p_class_code: classCode.toUpperCase(),
        p_student_id: user.id
      });
    
    console.log('[classesService] joinClassByCode - response:', data);
    console.log('[classesService] joinClassByCode - error:', error);
    
    if (error) {
      console.error('[classesService] RPC error:', error);
      throw error;
    }
    return data; // Returns class_id
  },

  /**
   * Leave a class (student only)
   */
  async leaveClass(classId: string) {
    const supabase = supabaseBrowser;
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('Not authenticated');
    
    const { error } = await supabase
      .from('class_memberships')
      .delete()
      .eq('class_id', classId)
      .eq('student_id', user.id);
    
    if (error) throw error;
  },

  /**
   * Get class statistics (real data)
   */
  async getClassStats(classId: string) {
    const supabase = supabaseBrowser;
    
    const { data, error } = await supabase
      .rpc('get_class_stats_real', { p_class_id: classId });
    
    if (error) throw error;
    return data?.[0] || {
      total_students: 0,
      active_students: 0,
      total_modules: 0,
      total_cards: 0,
      avg_completion: 0,
      total_study_sessions: 0,
      avg_score: 0,
    };
  },

  /**
   * Get all students stats in a class
   */
  async getAllStudentsStats(classId: string) {
    const supabase = supabaseBrowser;
    
    const { data, error } = await supabase
      .rpc('get_all_class_students_stats', { p_class_id: classId });
    
    if (error) throw error;
    return data || [];
  },

  /**
   * Get recent activity in a class
   */
  async getClassRecentActivity(classId: string, limit: number = 10) {
    const supabase = supabaseBrowser;
    
    const { data, error } = await supabase
      .rpc('get_class_recent_activity', {
        p_class_id: classId,
        p_limit: limit
      });
    
    if (error) throw error;
    return data || [];
  },

  /**
   * Remove a student from a class
   */
  async removeStudent(classId: string, studentId: string) {
    const supabase = supabaseBrowser;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Not authenticated');

    // Verify teacher owns the class
    const { data: classData } = await supabase
      .from('classes')
      .select('teacher_id')
      .eq('id', classId)
      .single();

    if (!classData || classData.teacher_id !== user.id) {
      throw new Error('You do not own this class');
    }

    const { error } = await supabase
      .from('class_memberships')
      .delete()
      .eq('class_id', classId)
      .eq('student_id', studentId);

    if (error) throw error;
  },

  /**
   * Get students in a class (teacher only)
   */
  async getClassStudents(classId: string) {
    const supabase = supabaseBrowser;
    
    const { data, error } = await supabase
      .from('class_memberships')
      .select(`
        id,
        joined_at,
        last_activity,
        student:profiles!class_memberships_student_id_fkey(
          id,
          username,
          first_name,
          last_name,
          avatar
        )
      `)
      .eq('class_id', classId)
      .order('joined_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  /**
   * Remove a student from a class (teacher only)
   */
  async removeStudent(classId: string, studentId: string) {
    const supabase = supabaseBrowser;
    
    const { error } = await supabase
      .from('class_memberships')
      .delete()
      .eq('class_id', classId)
      .eq('student_id', studentId);
    
    if (error) throw error;
  },
};

