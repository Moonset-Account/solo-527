import { defineStore } from 'pinia'
import api from '@/api'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    userInfo: null,
    roles: [],
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    isAdmin: (state) => state.roles?.some((r) => r.slug === 'admin'),
    isWorkshopManager: (state) => state.roles?.some((r) => r.slug === 'workshop_manager'),
    canManage: (state) => state.roles?.some((r) => ['admin', 'workshop_manager'].includes(r.slug)),
  },

  actions: {
    async login(credentials) {
      const res = await api.post('/auth/login', credentials)
      this.token = res.data.token
      this.userInfo = res.data.user
      this.roles = res.data.user.roles
      localStorage.setItem('token', res.data.token)
      return res.data
    },

    async logout() {
      try {
        await api.post('/auth/logout')
      } catch (e) {}
      this.token = ''
      this.userInfo = null
      this.roles = []
      localStorage.removeItem('token')
    },

    async getCurrentUser() {
      const res = await api.get('/auth/me')
      this.userInfo = res.data.user
      this.roles = res.data.user.roles
      return res.data.user
    },
  },
})
