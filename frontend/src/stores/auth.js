import { defineStore } from 'pinia'
import api from '@/utils/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    user: JSON.parse(localStorage.getItem('user') || 'null')
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    currentUser: (state) => state.user,
    userRole: (state) => state.user?.role || ''
  },

  actions: {
    async login(credentials) {
      const response = await api.post('/auth/login', credentials)
      this.token = response.token
      this.user = response.user
      localStorage.setItem('token', response.token)
      localStorage.setItem('user', JSON.stringify(response.user))
      return response
    },

    async register(data) {
      const response = await api.post('/auth/register', data)
      return response
    },

    async fetchProfile() {
      const response = await api.get('/auth/profile')
      this.user = response
      localStorage.setItem('user', JSON.stringify(response))
      return response
    },

    async logout() {
      try {
        await api.post('/auth/logout')
      } catch (e) {
        // ignore
      }
      this.token = ''
      this.user = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  }
})
