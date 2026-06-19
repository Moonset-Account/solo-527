import { ref } from 'vue'
import { defineStore } from 'pinia'

interface Notification {
  id: number
  metricName: string
  oldCaliber: string
  newCaliber: string
  notified: boolean
  createdAt: string
}

export const useAppStore = defineStore('app', () => {
  const sidebarCollapsed = ref(false)
  const notifications = ref<Notification[]>([])

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  async function fetchNotifications() {
    try {
      const res = await fetch('/api/subscriptions/events?status=new', {})
      const data = await res.json()
      if (data.success) {
        notifications.value = data.data
          .filter((e: any) => e.isCaliberRelated)
          .map((e: any) => ({
            id: e.id,
            metricName: e.metricName,
            oldCaliber: '',
            newCaliber: '',
            notified: true,
            createdAt: e.detectedAt,
          }))
      }
    } catch {
      // ignore
    }
  }

  function addNotification(n: Notification) {
    notifications.value.unshift(n)
  }

  return { sidebarCollapsed, notifications, toggleSidebar, fetchNotifications, addNotification }
})
