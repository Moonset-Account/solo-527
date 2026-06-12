import { defineStore } from 'pinia'
import type { UserInfo } from '~/composables/types'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: '' as string,
    user: null as UserInfo | null,
  }),
  getters: {
    isLoggedIn: (state) => !!state.token,
    isAdmin: (state) => state.user?.role === 'admin',
    isManager: (state) => state.user?.role === 'compliance_manager',
    isLawyer: (state) => state.user?.role === 'lawyer',
    isReviewer: (state) => state.user?.role === 'reviewer',
    canManage: (state) => ['admin', 'compliance_manager'].includes(state.user?.role || ''),
  },
  actions: {
    setAuth(token: string, user: UserInfo) {
      this.token = token
      this.user = user
      if (process.client) {
        localStorage.setItem('qinghe_token', token)
        localStorage.setItem('qinghe_user', JSON.stringify(user))
      }
    },
    logout() {
      this.token = ''
      this.user = null
      if (process.client) {
        localStorage.removeItem('qinghe_token')
        localStorage.removeItem('qinghe_user')
      }
    },
    hydrate() {
      if (process.client) {
        const t = localStorage.getItem('qinghe_token')
        const u = localStorage.getItem('qinghe_user')
        if (t) this.token = t
        if (u) {
          try { this.user = JSON.parse(u) } catch (_) {}
        }
      }
    },
    updateUser(user: Partial<UserInfo>) {
      if (this.user) {
        this.user = { ...this.user, ...user }
        if (process.client) localStorage.setItem('qinghe_user', JSON.stringify(this.user))
      }
    },
  },
})
