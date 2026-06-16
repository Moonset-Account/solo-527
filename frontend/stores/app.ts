import { defineStore } from 'pinia'

interface AppState {
  collapsed: boolean
  theme: 'light' | 'dark'
}

export const useAppStore = defineStore('app', {
  state: (): AppState => ({
    collapsed: false,
    theme: 'light',
  }),

  actions: {
    toggleCollapsed() {
      this.collapsed = !this.collapsed
    },
    toggleTheme() {
      this.theme = this.theme === 'light' ? 'dark' : 'light'
    },
  },
})
