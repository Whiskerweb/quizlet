import type { Database } from '@/lib/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];

/**
 * Get display name from profile
 * Uses first_name + last_name if available, falls back to username, then email
 */
export function getDisplayName(profile: Profile | null | undefined, email?: string | null): string {
  if (!profile) {
    return email?.split('@')[0] || 'User';
  }

  if (profile.first_name && profile.last_name) {
    return `${profile.first_name} ${profile.last_name}`;
  }

  if (profile.first_name) {
    return profile.first_name;
  }

  if (profile.last_name) {
    return profile.last_name;
  }

  // Fallback to username if name not available
  if (profile.username) {
    return profile.username;
  }

  // Final fallback to email
  return email?.split('@')[0] || 'User';
}

/**
 * Get initials from profile
 * Uses first_name + last_name if available, falls back to username, then email
 */
export function getInitials(profile: Profile | null | undefined, email?: string | null): string {
  if (!profile) {
    return email?.[0]?.toUpperCase() || 'U';
  }

  if (profile.first_name && profile.last_name) {
    return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
  }

  if (profile.first_name) {
    return profile.first_name[0]?.toUpperCase() || 'U';
  }

  if (profile.last_name) {
    return profile.last_name[0]?.toUpperCase() || 'U';
  }

  // Fallback to username
  if (profile.username) {
    return profile.username[0]?.toUpperCase() || 'U';
  }

  // Final fallback to email
  return email?.[0]?.toUpperCase() || 'U';
}
