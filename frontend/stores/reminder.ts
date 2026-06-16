import { defineStore } from 'pinia'
import type { Reminder, ReminderListResponse, FilterParams } from '~/types'

export const useReminderStore = defineStore('reminder', () => {
  const api = useApi()
  const records = ref<Reminder[]>([])
  const total = ref(0)
  const loading = ref(false)

  async function fetchList(filters: Partial<FilterParams>) {
    loading.value = true
    try {
      const res = await api.reminder.list(filters)
      records.value = res.items
      total.value = res.total
    } finally {
      loading.value = false
    }
  }

  async function acknowledge(id: string, acknowledgedBy: string) {
    return api.reminder.acknowledge(id, { acknowledged_by: acknowledgedBy })
  }

  async function resolve(id: string, resolvedBy: string) {
    return api.reminder.resolve(id, { resolved_by: resolvedBy })
  }

  async function escalate(id: string) {
    return api.reminder.escalate(id)
  }

  return { records, total, loading, fetchList, acknowledge, resolve, escalate }
})
