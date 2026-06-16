import { defineStore } from 'pinia'
import type { Payment, PaymentListResponse, FilterParams } from '~/types'

export const usePaymentStore = defineStore('payment', () => {
  const api = useApi()
  const records = ref<Payment[]>([])
  const total = ref(0)
  const loading = ref(false)

  async function fetchList(filters: Partial<FilterParams>) {
    loading.value = true
    try {
      const res = await api.payment.list(filters)
      records.value = res.items
      total.value = res.total
    } finally {
      loading.value = false
    }
  }

  return { records, total, loading, fetchList }
})
