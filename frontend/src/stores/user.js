import { defineStore } from 'pinia'
import { authApi } from '@/api'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    user: JSON.parse(localStorage.getItem('user') || 'null')
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    userRole: (state) => state.user?.role,
    userName: (state) => state.user?.real_name || state.user?.username
  },

  actions: {
    async login(username, password) {
      const response = await authApi.login({ username, password })
      this.token = response.token
      this.user = response.user
      localStorage.setItem('token', response.token)
      localStorage.setItem('user', JSON.stringify(response.user))
      return response
    },

    async logout() {
      try {
        await authApi.logout()
      } catch (e) {
        // ignore
      }
      this.token = ''
      this.user = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },

    async fetchUserInfo() {
      try {
        const user = await authApi.me()
        this.user = user
        localStorage.setItem('user', JSON.stringify(user))
        return user
      } catch (e) {
        this.logout()
        throw e
      }
    }
  }
})
