import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    currentUser: { id: 'u1', name: '管理员', role: 'admin', phone: '13800000001' } as any,
    token: null as string | null,
    isLoggedIn: true
  }),
  actions: {
    setUser(user: any) {
      this.currentUser = user
      this.isLoggedIn = true
    },
    logout() {
      this.currentUser = null
      this.token = null
      this.isLoggedIn = false
    }
  }
})
