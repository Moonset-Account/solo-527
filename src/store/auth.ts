'use client';

import { create } from 'zustand';
import type { User, UserRole, ApiResponse } from '@/lib/types';

interface AuthState {
  user: User | null;
  role: UserRole | null;
  permissions: string[];
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchCurrentUser: () => Promise<void>;
  hasPermission: (allowedRoles: UserRole[]) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  role: null,
  permissions: [],
  loading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data: ApiResponse<User> = await res.json();
      
      if (data.success && data.data) {
        set({ 
          user: data.data, 
          role: data.data.role,
          loading: false 
        });
      } else {
        set({ error: data.message || '登录失败', loading: false });
      }
    } catch (error) {
      set({ error: '网络错误，请稍后重试', loading: false });
    }
  },

  logout: () => {
    set({ user: null, role: null, permissions: [] });
    localStorage.removeItem('token');
  },

  fetchCurrentUser: async () => {
    set({ loading: true });
    try {
      const res = await fetch('/api/users/me');
      const data: ApiResponse<User> = await res.json();
      
      if (data.success && data.data) {
        set({ 
          user: data.data, 
          role: data.data.role,
          loading: false 
        });
      } else {
        set({ loading: false });
      }
    } catch {
      set({ loading: false });
    }
  },

  hasPermission: (allowedRoles: UserRole[]) => {
    const { role } = get();
    if (!role) return false;
    return allowedRoles.includes(role);
  },
}));
