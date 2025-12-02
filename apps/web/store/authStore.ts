import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthState {
  user: User | null;
  profile: Profile | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setAuth: (user: User | null, profile: Profile | null) => void;
  logout: () => Promise<void>;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,

  setUser: (user) => set({ user }),

  setProfile: (profile) => set({ profile }),

  setAuth: (user, profile) => set({ user, profile }),

  logout: async () => {
    const { supabaseBrowser } = await import('@/lib/supabaseBrowserClient');
    await supabaseBrowser.auth.signOut();
    set({ user: null, profile: null });
  },

  clearAuth: () => set({ user: null, profile: null }),
}));
