import { defineStore } from 'pinia'
import { apiClient } from '~/utils/api'

export interface User {
  id: number
  username: string
  email: string
  full_name: string
  phone: string
  role: string
  department: string
  is_active: boolean
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: '' as string,
    user: null as User | null,
    initialized: false
  }),

  getters: {
    isInitialized: (state) => state.initialized,
    isLoggedIn: (state) => !!state.token,
    isAdmin: (state) => state.user?.role === 'admin',
    isManager: (state) => ['admin', 'manager'].includes(state.user?.role || ''),
    isPurchaser: (state) => ['admin', 'manager', 'purchaser'].includes(state.user?.role || ''),
    isWarehouse: (state) => ['admin', 'warehouse'].includes(state.user?.role || ''),
    canAccessAdmin: (state) => ['admin', 'manager'].includes(state.user?.role || '')
  },

  actions: {
    init() {
      if (this.initialized) return
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token')
        const userStr = localStorage.getItem('user')
        if (token) this.token = token
        if (userStr) {
          try {
            this.user = JSON.parse(userStr)
          } catch (e) {}
        }
      }
      this.initialized = true
    },

    async login(username: string, password: string) {
      const res = await apiClient.post<any>('/auth/login', { username, password })
      this.token = res.access_token
      this.user = res.user
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', res.access_token)
        localStorage.setItem('user', JSON.stringify(res.user))
      }
      return res
    },

    async fetchCurrentUser() {
      try {
        const user = await apiClient.get<User>('/auth/me')
        this.user = user
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(user))
        }
        return user
      } catch (e) {
        this.logout()
        throw e
      }
    },

    logout() {
      this.token = ''
      this.user = null
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
      navigateTo('/login')
    }
  }
})
