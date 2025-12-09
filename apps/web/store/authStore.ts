import { create } from 'zustand';
import { supabaseBrowser } from '@/lib/supabaseBrowserClient';
import type { User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  email: string;
  username: string;
  first_name?: string | null;
  last_name?: string | null;
  avatar?: string | null;
  is_premium: boolean;
  role?: 'student' | 'teacher';
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => Promise<void>;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => {
  return {
    user: null,
    profile: null,
    loading: true,
    setUser: (user) => set({ user }),
    setProfile: (profile) => set({ profile }),
    setLoading: (loading) => set({ loading }),
    logout: async () => {
      await supabaseBrowser.auth.signOut();
      set({ user: null, profile: null });
    },
    isAuthenticated: () => {
      const state = get();
      // Vérifier si l'utilisateur existe dans le store
      // Le profil peut être null temporairement (ex: après OAuth avant chargement)
      // mais si user existe, c'est qu'il y a une session valide
      return state.user !== null;
    },
  };
});

