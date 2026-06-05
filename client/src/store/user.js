import { defineStore } from 'pinia';
import { authAPI } from '@/api';

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    token: null,
    loading: false
  }),
  getters: {
    isLoggedIn: (state) => !!state.token,
    isAdmin: (state) => state.user?.role === 'admin',
    isVolunteer: (state) => ['admin', 'volunteer'].includes(state.user?.role),
    isVerified: (state) => state.user?.verified
  },
  actions: {
    async login(credentials) {
      this.loading = true;
      try {
        const res = await authAPI.login(credentials);
        this.token = res.token;
        this.user = res.user;
        this.saveToStorage();
        return res;
      } finally {
        this.loading = false;
      }
    },
    async register(data) {
      this.loading = true;
      try {
        const res = await authAPI.register(data);
        this.token = res.token;
        this.user = res.user;
        this.saveToStorage();
        return res;
      } finally {
        this.loading = false;
      }
    },
    async fetchCurrentUser() {
      try {
        const res = await authAPI.getCurrentUser();
        this.user = res.user;
        this.saveToStorage();
      } catch (e) {
        console.error(e);
      }
    },
    async updateProfile(data) {
      const res = await authAPI.updateProfile(data);
      this.user = res.user;
      this.saveToStorage();
      return res;
    },
    logout() {
      this.user = null;
      this.token = null;
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    },
    saveToStorage() {
      if (this.user) localStorage.setItem('user', JSON.stringify(this.user));
      if (this.token) localStorage.setItem('token', this.token);
    },
    restoreFromStorage() {
      const user = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      if (user) this.user = JSON.parse(user);
      if (token) this.token = token;
    }
  }
});
