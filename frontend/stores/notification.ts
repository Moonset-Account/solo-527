import { defineStore } from 'pinia'

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    notifications: [] as any[],
    loading: false
  }),
  getters: {
    unreadCount(state) {
      return state.notifications.filter(n => !n.read).length
    }
  },
  actions: {
    async fetchNotifications() {
      this.loading = true
      try {
        const api = useApi()
        this.notifications = await api.getNotifications()
      } finally {
        this.loading = false
      }
    },
    async markRead(id: string) {
      const api = useApi()
      await api.markNotificationRead(id)
      const n = this.notifications.find(n => n.id === id)
      if (n) n.read = true
    },
    async markAllRead() {
      for (const n of this.notifications.filter(n => !n.read)) {
        await this.markRead(n.id)
      }
    }
  }
})
