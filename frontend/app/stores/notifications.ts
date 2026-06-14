import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { notificationApi } from '~/utils/api'
import type { Notification } from '~/types'

export const useNotificationsStore = defineStore('notifications', () => {
  const notifications = ref<Notification[]>([])
  const total = ref(0)
  const loading = ref(false)

  const unreadCount = computed(() => notifications.value.filter(n => !n.is_read).length)

  async function fetchList(params?: { page?: number; page_size?: number; is_read?: boolean }) {
    loading.value = true
    try {
      const res = await notificationApi.list(params)
      notifications.value = res.items
      total.value = res.total
    } finally {
      loading.value = false
    }
  }

  async function markRead(id: number) {
    await notificationApi.markRead(id)
    const n = notifications.value.find(n => n.id === id)
    if (n) n.is_read = true
  }

  async function markAllRead() {
    const unread = notifications.value.filter(n => !n.is_read)
    for (const n of unread) {
      await notificationApi.markRead(n.id)
      n.is_read = true
    }
  }

  return { notifications, total, loading, unreadCount, fetchList, markRead, markAllRead }
})
