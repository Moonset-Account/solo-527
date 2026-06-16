import { defineStore } from 'pinia'
import type { Writeoff, WriteoffListResponse, FilterParams } from '~/types'

export const useWriteoffStore = defineStore('writeoff', () => {
  const api = useApi()
  const records = ref<Writeoff[]>([])
  const total = ref(0)
  const loading = ref(false)

  async function fetchList(filters: Partial<FilterParams>) {
    loading.value = true
    try {
      const res = await api.writeoff.list(filters)
      records.value = res.items
      total.value = res.total
    } finally {
      loading.value = false
    }
  }

  return { records, total, loading, fetchList }
})
