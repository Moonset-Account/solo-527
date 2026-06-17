import { defineStore } from 'pinia'
import { ref, onMounted } from 'vue'
import { notificationApi } from '@/api'
import type { Notification } from '@/types'

export const useNotificationStore = defineStore('notification', () => {
  const unreadCount = ref(0)
  const notifications = ref<Notification[]>([])

  async function fetchUnreadCount() {
    try {
      unreadCount.value = await notificationApi.unreadCount()
    } catch {}
  }

  async function fetchList(params?: any) {
    try {
      const res = await notificationApi.list(params)
      notifications.value = res.list
      unreadCount.value = res.unreadCount
      return res
    } catch {
      return null
    }
  }

  async function markRead(id: string) {
    await notificationApi.markRead(id)
    if (unreadCount.value > 0) unreadCount.value--
    const notif = notifications.value.find((n) => n._id === id)
    if (notif && !notif.readBy.includes('me')) {
      // optimistic update
    }
  }

  async function markAllRead() {
    await notificationApi.markAllRead()
    unreadCount.value = 0
  }

  async function confirm(id: string) {
    return notificationApi.confirm(id)
  }

  return {
    unreadCount,
    notifications,
    fetchUnreadCount,
    fetchList,
    markRead,
    markAllRead,
    confirm,
  }
})
