import { create } from 'zustand';
import { api } from '@/lib/api';

interface User {
  id: number;
  username: string;
  displayName: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
  error: null,

  login: async (username: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post<{ token: string; user: User }>('/auth/login', { username, password });
      localStorage.setItem('token', res.token);
      set({ token: res.token, user: res.user, isAuthenticated: true, loading: false });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '登录失败';
      set({ error: msg, loading: false });
      throw e;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  fetchProfile: async () => {
    try {
      const user = await api.get<User>('/auth/profile');
      set({ user });
    } catch {
      localStorage.removeItem('token');
      set({ user: null, token: null, isAuthenticated: false });
    }
  },
}));
