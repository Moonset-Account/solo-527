import { defineStore } from 'pinia'

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    notifications: [] as any[],
    loading: false,
  }),
  getters: {
    unreadCount(state) {
      return state.notifications.filter((n: any) => !n.read).length
    },
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
    async markRead(id: string | number) {
      const api = useApi()
      await api.markNotificationRead(id)
      const n = this.notifications.find((x: any) => String(x.id) === String(id))
      if (n) n.read = true
    },
    async markAllRead() {
      const api = useApi()
      await api.markAllNotificationsRead()
      this.notifications.forEach((n: any) => (n.read = true))
    },
  },
})
