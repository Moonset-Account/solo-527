export interface NotificationItem {
  id: number
  type: string
  title: string
  content: string
  isRead: boolean
  alertId: number | null
  changeId: number | null
  createdAt: string
}

export const useNotification = () => {
  const list = ref<NotificationItem[]>([])
  const unreadCount = ref(0)
  const total = ref(0)
  const page = ref(1)
  const pageSize = ref(20)
  const loading = ref(false)

  async function fetchList(opts?: { unread?: boolean; page?: number }) {
    loading.value = true
    try {
      const query = new URLSearchParams()
      if (opts?.unread) query.set('unread', 'true')
      if (opts?.page) query.set('page', String(opts.page))
      page.value = opts?.page || 1

      const data = await $fetch<{ data: NotificationItem[]; total: number; unreadCount: number }>(
        `/api/notifications?${query.toString()}`
      )
      list.value = data.data
      total.value = data.total
      unreadCount.value = data.unreadCount
    } finally {
      loading.value = false
    }
  }

  async function markRead(id: number) {
    await $fetch(`/api/notifications/${id}/read`, { method: 'PUT' })
    const item = list.value.find(n => n.id === id)
    if (item) {
      item.isRead = true
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    }
  }

  async function markAllRead() {
    await $fetch('/api/notifications/read-all', { method: 'PUT' })
    list.value.forEach(n => (n.isRead = true))
    unreadCount.value = 0
  }

  return {
    list,
    unreadCount,
    total,
    page,
    pageSize,
    loading,
    fetchList,
    markRead,
    markAllRead
  }
}
