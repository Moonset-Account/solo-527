import { create } from 'zustand';
import type { User } from '@/types';
import * as authApi from '@/api/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  loadProfile: () => Promise<void>;
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),

  login: async (username: string, password: string) => {
    const res = await authApi.login(username, password);
    const { access, refresh } = res.data;
    localStorage.setItem('token', access);
    localStorage.setItem('refresh', refresh);
    set({ token: access, isAuthenticated: true });
    const profileRes = await authApi.getProfile();
    set({ user: profileRes.data });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh');
    set({ user: null, token: null, isAuthenticated: false });
  },

  loadProfile: async () => {
    try {
      const res = await authApi.getProfile();
      set({ user: res.data, isAuthenticated: true });
    } catch {
      set({ user: null, token: null, isAuthenticated: false });
      localStorage.removeItem('token');
      localStorage.removeItem('refresh');
    }
  },
}));

export default useAuthStore;
