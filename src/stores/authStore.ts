import { create } from 'zustand';
import type { AuthUser, UserRole } from '../../shared/types';
import { authApi, setToken, removeToken } from '@/utils/api';

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

const adminNav: NavItem[] = [
  { label: '仪表盘', path: '/dashboard', icon: 'LayoutDashboard' },
  { label: '会员管理', path: '/members', icon: 'Users' },
  { label: '教练管理', path: '/coaches', icon: 'Dumbbell' },
  { label: '套餐管理', path: '/packages', icon: 'Package' },
  { label: '团课管理', path: '/group-classes', icon: 'UsersRound' },
  { label: '预约管理', path: '/appointments', icon: 'CalendarCheck' },
  { label: '冻结管理', path: '/freeze', icon: 'Snowflake' },
  { label: '体测记录', path: '/body-tests', icon: 'Activity' },
  { label: '消息中心', path: '/messages', icon: 'Bell' },
  { label: '续费漏斗', path: '/renewal-funnel', icon: 'Filter' },
  { label: '审计日志', path: '/audit-log', icon: 'ScrollText' },
];

const coachNav: NavItem[] = [
  { label: '仪表盘', path: '/dashboard', icon: 'LayoutDashboard' },
  { label: '我的排班', path: '/coaches/my-schedule', icon: 'Calendar' },
  { label: '预约管理', path: '/appointments', icon: 'CalendarCheck' },
  { label: '体测记录', path: '/body-tests', icon: 'Activity' },
  { label: '消息中心', path: '/messages', icon: 'Bell' },
  { label: '我的业绩', path: '/coaches/my-performance', icon: 'TrendingUp' },
];

const receptionistNav: NavItem[] = [
  { label: '仪表盘', path: '/dashboard', icon: 'LayoutDashboard' },
  { label: '会员管理', path: '/members', icon: 'Users' },
  { label: '套餐管理', path: '/packages', icon: 'Package' },
  { label: '预约管理', path: '/appointments', icon: 'CalendarCheck' },
  { label: '冻结管理', path: '/freeze', icon: 'Snowflake' },
  { label: '消息中心', path: '/messages', icon: 'Bell' },
  { label: '团课管理', path: '/group-classes', icon: 'UsersRound' },
];

const memberNav: NavItem[] = [
  { label: '仪表盘', path: '/dashboard', icon: 'LayoutDashboard' },
  { label: '我的套餐', path: '/members/my-packages', icon: 'Package' },
  { label: '我的预约', path: '/members/my-appointments', icon: 'CalendarCheck' },
  { label: '体测记录', path: '/body-tests', icon: 'Activity' },
  { label: '消息中心', path: '/messages', icon: 'Bell' },
];

const navMap: Record<UserRole, NavItem[]> = {
  admin: adminNav,
  coach: coachNav,
  receptionist: receptionistNav,
  member: memberNav,
};

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  navItems: NavItem[];
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('gym_token'),
  isAuthenticated: !!localStorage.getItem('gym_token'),
  navItems: [],
  loading: false,
  error: null,
  login: async (username: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const data = await authApi.login(username, password);
      setToken(data.token);
      set({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
        navItems: navMap[data.user.role] || [],
        loading: false,
      });
    } catch (err: any) {
      set({ error: err.message || '登录失败', loading: false });
      throw err;
    }
  },
  logout: () => {
    removeToken();
    set({ user: null, token: null, isAuthenticated: false, navItems: [] });
  },
  fetchMe: async () => {
    try {
      const user = await authApi.getMe();
      set({ user, navItems: navMap[user.role] || [] });
    } catch {
      removeToken();
      set({ user: null, token: null, isAuthenticated: false, navItems: [] });
    }
  },
}));
