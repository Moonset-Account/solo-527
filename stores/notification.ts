import { defineStore } from 'pinia'
import type { Notification } from '~/types'

interface NotificationState {
  items: Notification[]
  unreadCount: number
  loading: boolean
}

export const useNotificationStore = defineStore('notification', {
  state: (): NotificationState => ({
    items: [],
    unreadCount: 0,
    loading: false,
  }),

  actions: {
    async fetchNotifications() {
      this.loading = true
      try {
        const data = await $fetch<Notification[]>('/api/notifications?limit=20')
        this.items = data
        this.unreadCount = data.filter(n => !n.read).length
      } finally {
        this.loading = false
      }
    },

    async fetchUnreadCount() {
      try {
        const data = await $fetch<{ count: number }>('/api/notifications/unread-count')
        this.unreadCount = data.count
      } catch {
        // ignore
      }
    },

    async markAsRead(id: string) {
      try {
        await $fetch(`/api/notifications/${id}/read`, { method: 'POST' })
        const item = this.items.find(n => n.id === id)
        if (item) {
          item.read = true
          this.unreadCount = Math.max(0, this.unreadCount - 1)
        }
      } catch {
        // ignore
      }
    },

    async markAllAsRead() {
      try {
        await $fetch('/api/notifications/read-all', { method: 'POST' })
        this.items.forEach(n => { n.read = true })
        this.unreadCount = 0
      } catch {
        // ignore
      }
    },
  },
})
