/**
 * Utility to ensure a user profile exists in the profiles table
 * This is needed for OAuth users where the trigger might not have created the profile
 */

import { supabaseBrowser } from '../supabaseBrowserClient';
import type { Database } from '../supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];

/**
 * Ensures a user profile exists in the profiles table
 * If the profile doesn't exist, creates it using the RPC function or direct insert
 * 
 * @param userId - The user ID from auth.users
 * @param userEmail - The user's email
 * @returns The profile object or null if user is not authenticated
 */
export async function ensureProfile(
  userId: string,
  userEmail: string
): Promise<Profile | null> {
  try {
    // First, check if profile exists
    const { data: existingProfile, error: fetchError } = await supabaseBrowser
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (existingProfile) {
      return existingProfile as Profile;
    }

    // Profile doesn't exist, create it
    // Generate a username from email or use a default
    const emailUsername = userEmail.split('@')[0];
    const baseUsername = emailUsername || `user_${userId.substring(0, 8)}`;

    // Try to create profile using RPC function if it exists
    try {
      await (supabaseBrowser.rpc as any)('create_or_update_profile', {
        user_id: userId,
        user_email: userEmail,
        user_username: baseUsername,
        user_first_name: null,
        user_last_name: null,
      });

      // Fetch the newly created profile
      const { data: newProfile, error: newProfileError } = await supabaseBrowser
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (newProfileError) {
        throw newProfileError;
      }

      return newProfile as Profile;
    } catch (rpcError) {
      // If RPC function doesn't exist or fails, try direct insert
      console.warn('RPC function failed, trying direct insert:', rpcError);

      // Check for username conflicts and generate a unique one
      let finalUsername = baseUsername;
      let counter = 0;
      let usernameExists = true;

      while (usernameExists && counter < 100) {
        const { data: conflictCheck } = await supabaseBrowser
          .from('profiles')
          .select('id')
          .eq('username', finalUsername)
          .limit(1);

        if (!conflictCheck || conflictCheck.length === 0) {
          usernameExists = false;
        } else {
          counter++;
          finalUsername = `${baseUsername}_${counter}`;
        }
      }

      // Insert the profile
      const { data: insertedProfile, error: insertError } = await supabaseBrowser
        .from('profiles')
        .insert({
          id: userId,
          email: userEmail,
          username: finalUsername,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      return insertedProfile as Profile;
    }
  } catch (error) {
    console.error('Failed to ensure profile:', error);
    return null;
  }
}

/**
 * Ensures profile exists for the current authenticated user
 * @returns The profile object or null if user is not authenticated
 */
export async function ensureCurrentUserProfile(): Promise<Profile | null> {
  const { data: { session } } = await supabaseBrowser.auth.getSession();
  
  if (!session?.user) {
    return null;
  }

  return ensureProfile(session.user.id, session.user.email || '');
}

