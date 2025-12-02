'use client';

import { create } from 'zustand';
import { supabaseBrowser } from '@/lib/supabaseBrowserClient';
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
        
        // Load profile
        const { data: profileData } = await supabaseBrowser
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();
        
        if (profileData) {
          set({ profile: profileData as Profile });
        } else {
          // Profile doesn't exist, try to create it
          const email = session.user.email || '';
          const emailUsername = email.split('@')[0];
          const baseUsername = emailUsername || `user_${session.user.id.substring(0, 8)}`;

          try {
            await (supabaseBrowser.rpc as any)('create_or_update_profile', {
              user_id: session.user.id,
              user_email: email,
              user_username: baseUsername,
              user_first_name: null,
              user_last_name: null,
            });

            // Reload profile after creation
            const { data: newProfileData } = await supabaseBrowser
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();
            
            if (newProfileData) {
              set({ profile: newProfileData as Profile });
            }
          } catch (error) {
            console.error('Failed to create profile:', error);
          }
        }
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
      
      // Load or create profile
      const { data: profileData } = await supabaseBrowser
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
      
      if (profileData) {
        set({ profile: profileData as Profile });
      } else {
        // Try to create profile
        const email = session.user.email || '';
        const emailUsername = email.split('@')[0];
        const baseUsername = emailUsername || `user_${session.user.id.substring(0, 8)}`;

        try {
          await (supabaseBrowser.rpc as any)('create_or_update_profile', {
            user_id: session.user.id,
            user_email: email,
            user_username: baseUsername,
            user_first_name: null,
            user_last_name: null,
          });

          const { data: newProfileData } = await supabaseBrowser
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();
          
          if (newProfileData) {
            set({ profile: newProfileData as Profile });
          }
        } catch (error) {
          console.error('Failed to create profile:', error);
        }
      }
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
        const { data: profileData } = await supabaseBrowser
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        
        if (profileData) {
          set({ profile: profileData as Profile });
        }
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
      return state.user !== null;
    },
  };
});
