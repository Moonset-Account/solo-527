import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

export type UserRole = 'member' | 'operator' | 'admin';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  name: string;
  phone: string;
  points: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  fetchCurrentUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      login: async (username: string, password: string) => {
        const response = await axios.post('/api/auth/login', { username, password });
        const { user, token } = response.data;
        
        set({
          user,
          token,
          isAuthenticated: true
        });
        
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      },
      
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false
        });
        delete axios.defaults.headers.common['Authorization'];
      },
      
      fetchCurrentUser: async () => {
        const token = get().token;
        if (!token) return;
        
        try {
          const response = await axios.get('/api/auth/me');
          set({ user: response.data });
        } catch (error) {
          get().logout();
        }
      }
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
        }
      }
    }
  )
);
