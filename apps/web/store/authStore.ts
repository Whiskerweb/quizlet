import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  isPremium: boolean;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => {
  // Initialize with null values to avoid hydration mismatch
  // We'll sync from localStorage in useEffect on client side
  return {
    user: null,
    accessToken: null,
    refreshToken: null,
    setAuth: (user, accessToken, refreshToken) => {
      set({ user, accessToken, refreshToken });
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
      }
    },
    setUser: (user) => {
      set({ user });
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(user));
      }
    },
    logout: () => {
      set({ user: null, accessToken: null, refreshToken: null });
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
    },
    isAuthenticated: () => {
      const state = get();
      // Check both state and localStorage for client-side
      if (typeof window !== 'undefined') {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('accessToken');
        return (state.user !== null && state.accessToken !== null) || 
               (storedUser !== null && storedToken !== null);
      }
      return state.user !== null && state.accessToken !== null;
    },
  };
});

// Sync store with localStorage on client mount
if (typeof window !== 'undefined') {
  const storedUser = localStorage.getItem('user');
  const storedToken = localStorage.getItem('accessToken');
  const storedRefreshToken = localStorage.getItem('refreshToken');
  
  if (storedUser && storedToken) {
    try {
      useAuthStore.getState().setAuth(
        JSON.parse(storedUser),
        storedToken,
        storedRefreshToken || ''
      );
    } catch (e) {
      // Ignore parse errors
    }
  }
}

