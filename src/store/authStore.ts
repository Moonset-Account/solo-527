import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Role } from '#shared/types';

interface AuthState {
  token: string | null;
  user: User | null;
  role: Role | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  hasRole: (roles: Role[]) => boolean;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      role: null,
      login: (token, user) => {
        set({ token, user, role: user.role });
        localStorage.setItem('token', token);
      },
      logout: () => {
        set({ token: null, user: null, role: null });
        localStorage.removeItem('token');
      },
      isAuthenticated: () => !!get().token && !!get().user,
      hasRole: (roles) => {
        const currentRole = get().role;
        return currentRole !== null && roles.includes(currentRole);
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token, user: state.user, role: state.role }),
    }
  )
);

export default useAuthStore;
