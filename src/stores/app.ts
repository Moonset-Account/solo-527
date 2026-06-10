import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    sidebarCollapsed: false,
    currentUser: null as any,
    token: localStorage.getItem('token') || '',
  }),
  actions: {
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed
    },
    setToken(token: string) {
      this.token = token
      localStorage.setItem('token', token)
    },
    clearAuth() {
      this.token = ''
      this.currentUser = null
      localStorage.removeItem('token')
    },
  },
})
