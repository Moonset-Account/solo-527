import { defineStore } from 'pinia'
import type { Refund, RefundListResponse, FilterParams } from '~/types'

export const useRefundStore = defineStore('refund', () => {
  const api = useApi()
  const records = ref<Refund[]>([])
  const total = ref(0)
  const loading = ref(false)

  async function fetchList(filters: Partial<FilterParams>) {
    loading.value = true
    try {
      const res = await api.refund.list(filters)
      records.value = res.items
      total.value = res.total
    } finally {
      loading.value = false
    }
  }

  async function review(id: string, data: { status: string; reviewed_by: string }) {
    return api.refund.review(id, data)
  }

  return { records, total, loading, fetchList, review }
})
