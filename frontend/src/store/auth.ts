import { create } from 'zustand';
import type { User } from '@/types';
import { authApi } from '@/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; fullName: string; phone?: string }) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
}

const loadFromStorage = () => {
  try {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    return { token, user };
  } catch {
    return { token: null, user: null };
  }
};

export const useAuthStore = create<AuthState>((set, get) => {
  const initial = loadFromStorage();
  return {
    user: initial.user,
    token: initial.token,
    isAuthenticated: !!initial.token,
    isLoading: false,

    login: async (email, password) => {
      set({ isLoading: true });
      try {
        const res = await authApi.login({ email, password });
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        set({
          token: res.token,
          user: res.user,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (e: any) {
        set({ isLoading: false });
        throw e;
      }
    },

    register: async (data) => {
      set({ isLoading: true });
      try {
        const res = await authApi.register(data);
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        set({
          token: res.token,
          user: res.user,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (e: any) {
        set({ isLoading: false });
        throw e;
      }
    },

    logout: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      set({
        token: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    },

    fetchMe: async () => {
      if (!get().token) return;
      set({ isLoading: true });
      try {
        const user = await authApi.getMe();
        localStorage.setItem('user', JSON.stringify(user));
        set({ user, isLoading: false });
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ token: null, user: null, isAuthenticated: false, isLoading: false });
      }
    },

    updateUser: (data) => {
      const newUser = { ...get().user, ...data } as User;
      localStorage.setItem('user', JSON.stringify(newUser));
      set({ user: newUser });
    },
  };
});
