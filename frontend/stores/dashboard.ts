import { defineStore } from 'pinia'
import type { ARRecordSummary } from '~/types'

export const useDashboardStore = defineStore('dashboard', () => {
  const api = useApi()
  const summary = ref<ARRecordSummary | null>(null)
  const loading = ref(false)

  async function fetchSummary() {
    loading.value = true
    try {
      summary.value = await api.ar.summary()
    } finally {
      loading.value = false
    }
  }

  const totalAR = computed(() => summary.value?.total_amount ?? 0)
  const overdueAmount = computed(() => summary.value?.overdue_amount ?? 0)
  const totalPaid = computed(() => summary.value?.total_paid ?? 0)
  const pendingRefunds = computed(() => 0)

  return { summary, loading, totalAR, overdueAmount, totalPaid, pendingRefunds, fetchSummary }
})
