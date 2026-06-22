import { create } from 'zustand';
import type { User, UserRole } from '@/types';
import { getCurrentUser } from '@/api/auth';

interface UserStore {
  user: User | null;
  token: string | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
  fetchUser: () => Promise<void>;
  isAdmin: () => boolean;
  hasRole: (role: UserRole | UserRole[]) => boolean;
}

const useUserStore = create<UserStore>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  
  setUser: (user) => set({ user }),
  setToken: (token) => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
    set({ token });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null });
  },
  fetchUser: async () => {
    try {
      const user = await getCurrentUser();
      set({ user });
      localStorage.setItem('user', JSON.stringify(user));
    } catch (err) {
      get().logout();
      throw err;
    }
  },
  isAdmin: () => {
    const { user } = get();
    if (!user) return false;
    return ['OP_ADMIN', 'FIN_ADMIN', 'SYS_ADMIN'].includes(user.role);
  },
  hasRole: (role) => {
    const { user } = get();
    if (!user) return false;
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    return user.role === role;
  },
}));

export default useUserStore;
