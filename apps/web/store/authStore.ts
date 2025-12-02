'use client';

import { create } from 'zustand';
import { supabaseBrowser } from '@/lib/supabaseBrowserClient';
import { ensureCurrentUserProfile } from '@/lib/utils/ensureProfile';
import type { User } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  loadProfile: () => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => {
  // Initialize: load user and profile on store creation
  const initializeAuth = async () => {
    set({ loading: true });
    try {
      const { data: { session } } = await supabaseBrowser.auth.getSession();
      
      if (session?.user) {
        set({ user: session.user });
        
        // Ensure profile exists (creates it if missing)
        const profile = await ensureCurrentUserProfile();
        set({ profile });
      } else {
        set({ user: null, profile: null });
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      set({ user: null, profile: null });
    } finally {
      set({ loading: false });
    }
  };

  // Initialize on store creation
  initializeAuth();

  // Listen for auth state changes
  supabaseBrowser.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      set({ user: session.user });
      
      // Ensure profile exists (creates it if missing)
      const profile = await ensureCurrentUserProfile();
      set({ profile });
    } else if (event === 'SIGNED_OUT') {
      set({ user: null, profile: null });
    }
  });

  return {
    user: null,
    profile: null,
    loading: true,
    setUser: (user) => set({ user }),
    setProfile: (profile) => set({ profile }),
    setLoading: (loading) => set({ loading }),
    loadProfile: async () => {
      const { user } = get();
      if (!user) {
        set({ profile: null });
        return;
      }

      try {
        // Ensure profile exists (creates it if missing)
        const profile = await ensureCurrentUserProfile();
        set({ profile });
      } catch (error) {
        console.error('Failed to load profile:', error);
        set({ profile: null });
      }
    },
    logout: async () => {
      await supabaseBrowser.auth.signOut();
      set({ user: null, profile: null });
    },
    isAuthenticated: () => {
      const state = get();
      return state.user !== null && state.profile !== null;
    },
  };
});
