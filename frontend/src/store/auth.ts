import { create } from 'zustand';
import api from '../utils/api';
import { UserRoleType } from '../utils/constants';

interface UserInfo {
  id: string;
  username: string;
  name: string;
  role: UserRoleType;
  email?: string;
  phone?: string;
}

interface AuthState {
  token: string | null;
  user: UserInfo | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  restore: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,

  login: async (username, password) => {
    const res: any = await api.post('/auth/login', { username, password });
    localStorage.setItem('accessToken', res.accessToken);
    localStorage.setItem('userInfo', JSON.stringify(res.user));
    set({ token: res.accessToken, user: res.user, isAuthenticated: true });
  },

  register: async (data) => {
    const res: any = await api.post('/auth/register', data);
    localStorage.setItem('accessToken', res.accessToken);
    localStorage.setItem('userInfo', JSON.stringify(res.user));
    set({ token: res.accessToken, user: res.user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userInfo');
    set({ token: null, user: null, isAuthenticated: false });
  },

  restore: () => {
    const token = localStorage.getItem('accessToken');
    const userStr = localStorage.getItem('userInfo');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({ token, user, isAuthenticated: true });
      } catch {}
    }
  },
}));
