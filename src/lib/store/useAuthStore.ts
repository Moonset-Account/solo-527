import { create } from 'zustand';
import type { Profile } from '@/lib/types';
import { mockProfiles } from '@/lib/mock/data';

interface AuthState {
  user: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, _password: string) => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 500));
    const user = mockProfiles.find(p => p.email === email);
    if (user) {
      localStorage.setItem('auth_user', JSON.stringify(user));
      set({ user, isAuthenticated: true, isLoading: false });
      return true;
    }
    set({ isLoading: false });
    return false;
  },

  logout: () => {
    localStorage.removeItem('auth_user');
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: () => {
    const stored = localStorage.getItem('auth_user');
    if (stored) {
      try {
        const user = JSON.parse(stored);
        set({ user, isAuthenticated: true, isLoading: false });
      } catch {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } else {
      set({ isLoading: false });
    }
  },
}));
