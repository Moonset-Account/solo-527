import { defineStore } from 'pinia';
import { login as loginApi, getProfile } from '@/api/user';
import type { User, Role } from '@/types';
import { ElMessage } from 'element-plus';

interface AuthState {
  token: string;
  userInfo: User | null;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: localStorage.getItem('token') || '',
    userInfo: JSON.parse(localStorage.getItem('userInfo') || 'null'),
  }),
  getters: {
    isLoggedIn: (s) => !!s.token,
    role: (s): Role | null => s.userInfo?.role || null,
    isAdmin: (s) => s.userInfo?.role === 'admin',
    isManager: (s) => s.userInfo?.role === 'admin' || s.userInfo?.role === 'manager',
  },
  actions: {
    async login(username: string, password: string) {
      const res: any = await loginApi({ username, password });
      this.token = res.accessToken;
      this.userInfo = res.user;
      localStorage.setItem('token', res.accessToken);
      localStorage.setItem('userInfo', JSON.stringify(res.user));
      ElMessage.success('登录成功');
      return res;
    },
    async fetchProfile() {
      this.userInfo = (await getProfile()) as User;
      localStorage.setItem('userInfo', JSON.stringify(this.userInfo));
    },
    logout() {
      this.token = '';
      this.userInfo = null;
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      ElMessage.success('已退出登录');
    },
  },
});
