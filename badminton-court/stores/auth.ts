import { defineStore } from 'pinia'

interface User {
  id: number
  username: string
  phone: string
  email?: string
  realName?: string
  avatar?: string
  role: string
  status: number
  balance?: number
  coachProfile?: any
  createdAt: string
  updatedAt: string
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: '',
    user: null as User | null,
    permissions: [] as string[],
    redirectUrl: ''
  }),
  getters: {
    isLoggedIn: (state) => !!state.token && !!state.user,
    role: (state) => state.user?.role || '',
    hasPermission: (state) => (code: string) => {
      if (state.user?.role === 'SUPER_ADMIN') return true
      return state.permissions.includes(code)
    },
    userName: (state) => state.user?.realName || state.user?.username || '用户'
  },
  actions: {
    async login(username: string, password: string) {
      const res = await $fetch<any>('/api/auth/login', {
        method: 'POST',
        body: { username, password }
      })
      if (res.code === 0) {
        this.token = res.data.token
        this.user = res.data.user
        this.permissions = res.data.permissions
        this.saveToStorage()
        return true
      }
      throw new Error(res.message || '登录失败')
    },
    async fetchMe() {
      try {
        const res = await $fetch<any>('/api/auth/me', {
          headers: { Authorization: `Bearer ${this.token}` }
        })
        if (res.code === 0) {
          this.user = res.data.user
          this.permissions = res.data.permissions
          this.saveToStorage()
          return true
        }
      } catch {}
      return false
    },
    logout() {
      this.token = ''
      this.user = null
      this.permissions = []
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
        localStorage.removeItem('auth_perms')
      }
      useRouter().push('/login')
    },
    saveToStorage() {
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', this.token)
        localStorage.setItem('auth_user', JSON.stringify(this.user))
        localStorage.setItem('auth_perms', JSON.stringify(this.permissions))
      }
    },
    loadFromStorage() {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('auth_token')
        const user = localStorage.getItem('auth_user')
        const perms = localStorage.getItem('auth_perms')
        if (token) this.token = token
        if (user) this.user = JSON.parse(user)
        if (perms) this.permissions = JSON.parse(perms)
      }
    }
  }
})
