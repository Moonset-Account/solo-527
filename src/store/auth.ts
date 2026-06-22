import { create } from 'zustand';
import { Profile, UserRole } from '@/types';
import { mockProfiles } from '@/lib/mock/data';

interface AuthState {
  user: Profile | null;
  isAuthenticated: boolean;
  login: (phone: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  login: async (phone: string, role: UserRole) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const user = mockProfiles.find((p) => p.phone === phone && p.role === role);
    if (user) {
      set({ user, isAuthenticated: true });
      localStorage.setItem('auth_user', JSON.stringify(user));
      return true;
    }
    return false;
  },

  logout: () => {
    set({ user: null, isAuthenticated: false });
    localStorage.removeItem('auth_user');
  },

  checkAuth: async () => {
    const stored = localStorage.getItem('auth_user');
    if (stored) {
      try {
        const user = JSON.parse(stored);
        set({ user, isAuthenticated: true });
        return true;
      } catch {
        localStorage.removeItem('auth_user');
      }
    }
    return false;
  },
}));
