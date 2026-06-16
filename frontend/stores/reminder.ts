import { defineStore } from 'pinia'
import type { Reminder, ReminderListResponse, FilterParams } from '~/types'

export const useReminderStore = defineStore('reminder', () => {
  const api = useApi()
  const records = ref<Reminder[]>([])
  const total = ref(0)
  const loading = ref(false)

  async function fetchList(filters: Partial<FilterParams> & Record<string, any>) {
    loading.value = true
    try {
      const res = await api.reminder.list(filters)
      records.value = res.items
      total.value = res.total
    } finally {
      loading.value = false
    }
  }

  return { records, total, loading, fetchList }
})
