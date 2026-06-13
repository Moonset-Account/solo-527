import { defineStore } from 'pinia'

export interface User {
  id: number
  username: string
  email: string
  full_name: string | null
  role: string
  is_active: boolean
  created_at: string
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: '',
    user: null as User | null
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    userRole: (state) => state.user?.role || '',
    isAdmin: (state) => state.user?.role === 'admin',
    isSupervisor: (state) => state.user?.role === 'supervisor',
    isAgent: (state) => state.user?.role === 'agent',
    isCustomer: (state) => state.user?.role === 'customer',
    canViewStats: (state) => ['admin', 'supervisor'].includes(state.user?.role || ''),
    canManageKB: (state) => ['admin', 'supervisor', 'agent'].includes(state.user?.role || '')
  },

  actions: {
    setAuth(token: string, user: User) {
      this.token = token
      this.user = user
      if (process.client) {
        localStorage.setItem('auth_token', token)
        localStorage.setItem('auth_user', JSON.stringify(user))
      }
    },

    clearAuth() {
      this.token = ''
      this.user = null
      if (process.client) {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
      }
    },

    restoreAuth() {
      if (process.client) {
        const token = localStorage.getItem('auth_token')
        const userStr = localStorage.getItem('auth_user')
        if (token && userStr) {
          this.token = token
          this.user = JSON.parse(userStr)
        }
      }
    }
  }
})
