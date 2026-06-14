import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { request } from '@/lib/api';

export type UserRole = 'admin' | 'equipment_supervisor' | 'planner';

export interface AuthUser {
  id: number;
  username: string;
  realName: string;
  role: UserRole;
  department?: string;
  phone?: string;
  email?: string;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      login: async (username: string, password: string) => {
        const res = await request({
          url: '/auth/login',
          method: 'POST',
          data: { username, password },
        });
        if (!res.success) throw new Error(res.error || '登录失败');
        set({ token: res.data.token, user: res.data.user });
      },
      logout: () => {
        set({ token: null, user: null });
      },
      fetchMe: async () => {
        const res = await request({ url: '/auth/me', method: 'GET' });
        if (res.success) set({ user: res.data });
      },
    }),
    {
      name: 'qinghe-auth-storage',
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);

export function hasRole(user: AuthUser | null, ...roles: UserRole[]): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}

export function isAdmin(user: AuthUser | null): boolean {
  return hasRole(user, 'admin');
}

export function canApproveReworkTimeout(user: AuthUser | null): boolean {
  return hasRole(user, 'admin', 'equipment_supervisor');
}

export const roleLabels: Record<UserRole, string> = {
  admin: '系统管理员',
  equipment_supervisor: '设备主管',
  planner: '计划员',
};

export const roleColors: Record<UserRole, string> = {
  admin: 'bg-violet-100 text-violet-700',
  equipment_supervisor: 'bg-sky-100 text-sky-700',
  planner: 'bg-brand-100 text-brand-700',
};
