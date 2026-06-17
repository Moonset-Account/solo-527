import { create } from 'zustand';
import { message } from 'antd';
import api from '../services/api';

export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  accessToken: localStorage.getItem('access_token') || null,
  isAuthenticated: !!localStorage.getItem('access_token'),
  isLoading: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await api.post('/users/login/', { email, password });
      const { access, refresh, user } = res.data;
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, accessToken: access, isAuthenticated: true });
      message.success('登录成功');
      return true;
    } catch (err) {
      message.error(err.response?.data?.detail || '登录失败');
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    set({ user: null, accessToken: null, isAuthenticated: false });
    message.success('已退出登录');
  },

  fetchCurrentUser: async () => {
    try {
      const res = await api.get('/users/me/');
      localStorage.setItem('user', JSON.stringify(res.data));
      set({ user: res.data });
    } catch (err) {
      console.error(err);
    }
  },
}));
