import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole, LoginResponse } from '../types';

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (data: LoginResponse) => void;
  setToken: (token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  hasRole: (role: UserRole | UserRole[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      setAuth: (data: LoginResponse) => {
        set({ token: data.access_token, user: data.user });
      },
      setToken: (token: string) => {
        set({ token });
      },
      setUser: (user: User) => {
        set({ user });
      },
      logout: () => {
        set({ token: null, user: null });
      },
      isAuthenticated: () => {
        return !!get().token;
      },
      hasRole: (role: UserRole | UserRole[]) => {
        const user = get().user;
        if (!user) return false;
        if (Array.isArray(role)) {
          return role.includes(user.role);
        }
        return user.role === role;
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
