import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';
import api from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  loadProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      login: async (username: string, password: string) => {
        const response = await api.post('/auth/login', { username, password });
        const { accessToken, user } = response.data;
        set({ user, token: accessToken, isAuthenticated: true });
      },
      
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
      },
      
      loadProfile: async () => {
        try {
          const response = await api.get('/auth/profile');
          set({ user: response.data });
        } catch (error) {
          set({ user: null, token: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
