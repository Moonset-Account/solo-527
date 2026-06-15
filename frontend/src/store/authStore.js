import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { request } from '../api/client';
import { AUTH } from '../api/endpoints';

const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const response = await request.post(AUTH.LOGIN, credentials);
          const { access, refresh, user } = response;
          
          localStorage.setItem('carwash_token', access);
          localStorage.setItem('carwash_user', JSON.stringify(user));

          set({
            token: access,
            refreshToken: refresh,
            user,
            isAuthenticated: true,
            isLoading: false,
          });
          
          return { success: true, user };
        } catch (error) {
          set({
            error: error.response?.data?.detail || '登录失败',
            isLoading: false,
          });
          return { success: false, error: error.response?.data?.detail || '登录失败' };
        }
      },

      logout: () => {
        set({
          token: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
          error: null,
        });
        localStorage.removeItem('carwash_token');
        localStorage.removeItem('carwash_user');
      },

      fetchCurrentUser: async () => {
        set({ isLoading: true });
        try {
          const user = await request.get(AUTH.CURRENT_USER);
          set({ user, isLoading: false });
          return user;
        } catch (error) {
          set({ isLoading: false });
          if (error.response?.status === 401) {
            get().logout();
          }
          throw error;
        }
      },

      refreshAccessToken: async () => {
        const { refreshToken } = get();
        if (!refreshToken) {
          get().logout();
          return false;
        }
        
        try {
          const response = await request.post(AUTH.REFRESH_TOKEN, {
            refresh: refreshToken,
          });
          localStorage.setItem('carwash_token', response.access);
          set({ token: response.access });
          return true;
        } catch (error) {
          get().logout();
          return false;
        }
      },

      updateUser: (userData) => {
        set({ user: { ...get().user, ...userData } });
      },

      clearError: () => {
        set({ error: null });
      },

      hasRole: (role) => {
        const { user } = get();
        if (!user) return false;
        return user.role === role || (Array.isArray(user.roles) && user.roles.includes(role));
      },

      hasPermission: (permission) => {
        const { user } = get();
        if (!user) return false;
        return user.permissions?.includes(permission) || user.is_superuser;
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
