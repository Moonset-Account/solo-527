import { defineStore } from 'pinia'

export interface User {
  id: number
  username: string
  email: string
  full_name: string | null
  department: string | null
  role: 'user' | 'admin' | 'security_officer'
  is_active: boolean
  created_at: string
  updated_at: string
}

interface AuthState {
  token: string | null
  user: User | null
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: null,
    user: null,
  }),

  getters: {
    isLoggedIn: (state) => !!state.token && !!state.user,
    isAdmin: (state) => state.user?.role === 'admin' || state.user?.role === 'security_officer',
    isSecurityOfficer: (state) => state.user?.role === 'security_officer',
    userRoleLabel: (state) => {
      const labels: Record<string, string> = {
        user: '普通用户',
        admin: '管理员',
        security_officer: '安全负责人',
      }
      return state.user ? labels[state.user.role] || state.user.role : ''
    },
  },

  actions: {
    async login(username: string, password: string) {
      const api = useApiClient()
      const result: any = await api.auth.login(username, password)
      this.token = result.access_token

      if (process.client) {
        localStorage.setItem('token', result.access_token)
      }

      await this.fetchUser()
      return result
    },

    async fetchUser() {
      const api = useApiClient()
      const user = await api.auth.getMe()
      this.user = user as User
      return user
    },

    logout() {
      this.token = null
      this.user = null
      if (process.client) {
        localStorage.removeItem('token')
      }
    },

    initAuth() {
      if (process.client) {
        const token = localStorage.getItem('token')
        if (token) {
          this.token = token
          this.fetchUser().catch(() => {
            this.logout()
          })
        }
      }
    },
  },
})
