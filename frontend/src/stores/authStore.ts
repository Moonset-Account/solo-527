import { create } from 'zustand';
import type { Member, AdminUser } from '@shared/types';

interface AuthState {
  token: string | null;
  user: Member | AdminUser | null;
  role: 'member' | 'ecommerce' | 'admin' | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: Member | AdminUser, role: string) => void;
  logout: () => void;
  updateUser: (user: Member | AdminUser) => void;
}

const getInitialToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

export const useAuthStore = create<AuthState>((set) => ({
  token: getInitialToken(),
  user: null,
  role: null,
  isAuthenticated: !!getInitialToken(),

  setAuth: (token, user, role) => {
    localStorage.setItem('token', token);
    set({ token, user, role: role as any, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, user: null, role: null, isAuthenticated: false });
  },

  updateUser: (user) => {
    set({ user });
  },
}));
