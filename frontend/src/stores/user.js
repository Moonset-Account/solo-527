import { defineStore } from 'pinia'
import { api } from '@/utils/request'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token') || ''
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    isAdmin: (state) => state.user?.role === 'admin' || state.user?.is_superuser,
    isManager: (state) => state.user?.role === 'admin' || state.user?.role === 'manager' || state.user?.is_superuser,
    isStaff: (state) => state.user?.role === 'staff'
  },

  actions: {
    async login(credentials) {
      const { data } = await api.post('/auth/auth/login/', credentials)
      this.token = data.access
      localStorage.setItem('token', data.access)
      localStorage.setItem('refresh_token', data.refresh)
      this.user = data.user
      return data
    },

    async logout() {
      try {
        const refresh = localStorage.getItem('refresh_token')
        await api.post('/auth/auth/logout/', { refresh })
      } catch (e) {
      }
      this.token = ''
      this.user = null
      localStorage.removeItem('token')
      localStorage.removeItem('refresh_token')
    },

    async fetchUserInfo() {
      const { data } = await api.get('/auth/auth/me/')
      this.user = data
      return data
    },

    async changePassword(oldPassword, newPassword) {
      await api.post('/auth/auth/change_password/', {
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: newPassword
      })
    }
  }
})
