import { create } from 'zustand';
import api from '../api';

export interface User {
  id: number;
  username: string;
  name: string;
  role: 'staff' | 'admin' | 'coach_supervisor' | 'manager';
  phone?: string;
  email?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),

  login: async (username: string, password: string) => {
    const response = await api.post('/auth/login', { username, password });
    const { token, user } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, user });
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.error('Logout error:', e);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null });
  },

  fetchMe: async () => {
    try {
      const response = await api.get('/auth/me');
      set({ user: response.data });
      localStorage.setItem('user', JSON.stringify(response.data));
    } catch (e) {
      set({ user: null, token: null });
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  isAuthenticated: () => {
    return !!get().token;
  },
}));
