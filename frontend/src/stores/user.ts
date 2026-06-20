import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import * as authApi from '../api/auth';
import type { User, LoginResponse } from '../types';

export const useUserStore = defineStore('user', () => {
  const token = ref<string | null>(localStorage.getItem('token'));
  const user = ref<User | null>(null);
  const loading = ref(false);

  const isLoggedIn = computed(() => !!token.value);
  const isAdmin = computed(() => user.value?.role === 'admin');
  const isInterviewer = computed(() => user.value?.role === 'interviewer');
  const isHR = computed(() => user.value?.role === 'hr');

  async function login(email: string, password: string) {
    loading.value = true;
    try {
      const response = await authApi.login({ email, password }) as LoginResponse;
      token.value = response.accessToken;
      user.value = response.user;
      localStorage.setItem('token', response.accessToken);
      localStorage.setItem('user', JSON.stringify(response.user));
      return response;
    } finally {
      loading.value = false;
    }
  }

  async function logout() {
    try {
      await authApi.logout();
    } finally {
      token.value = null;
      user.value = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }

  function loadUserFromStorage() {
    const storedUser = localStorage.getItem('user');
    if (storedUser && token.value) {
      try {
        user.value = JSON.parse(storedUser);
      } catch {
        localStorage.removeItem('user');
      }
    }
  }

  function hasRole(roles: string[]) {
    if (!user.value) return false;
    return roles.includes(user.value.role);
  }

  return {
    token,
    user,
    loading,
    isLoggedIn,
    isAdmin,
    isInterviewer,
    isHR,
    login,
    logout,
    loadUserFromStorage,
    hasRole,
  };
});
