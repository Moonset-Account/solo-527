import { create } from 'zustand';
import { User } from '../types';
import { api } from '../api';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null,
  isAuthenticated: !!localStorage.getItem('token'),

  setAuth: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null, isAuthenticated: false });
  },

  fetchMe: async () => {
    try {
      const user = await api.auth.me();
      set({ user });
      localStorage.setItem('user', JSON.stringify(user));
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      set({ token: null, user: null, isAuthenticated: false });
    }
  }
}));
