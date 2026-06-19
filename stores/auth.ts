import { defineStore } from 'pinia'
import type { User } from '~/types'

interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    token: null,
    loading: false,
  }),

  getters: {
    isLoggedIn: (state) => !!state.user,
    userRole: (state) => state.user?.role || null,
    userName: (state) => state.user?.name || '',
  },

  actions: {
    async login(phone: string, password: string) {
      this.loading = true
      try {
        const data = await $fetch<{ user: User; token: string }>('/api/auth/login', {
          method: 'POST',
          body: { phone, password },
        })
        this.user = data.user
        this.token = data.token
        return { success: true }
      } catch (error: any) {
        return { success: false, error: error.data?.message || '登录失败' }
      } finally {
        this.loading = false
      }
    },

    async fetchCurrentUser() {
      try {
        const data = await $fetch<User>('/api/auth/me')
        this.user = data
        return data
      } catch {
        this.user = null
        return null
      }
    },

    async logout() {
      try {
        await $fetch('/api/auth/logout', { method: 'POST' })
      } catch {
        // ignore
      }
      this.user = null
      this.token = null
      await navigateTo('/login')
    },

    setUser(user: User) {
      this.user = user
    },
  },
})
