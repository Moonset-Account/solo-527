import { defineStore } from 'pinia'
import type { ARRecordSummary } from '~/types'

export const useDashboardStore = defineStore('dashboard', () => {
  const api = useApi()
  const summaryList = ref<ARRecordSummary[]>([])
  const loading = ref(false)

  async function fetchSummary() {
    loading.value = true
    try {
      summaryList.value = await api.ar.summary()
    } finally {
      loading.value = false
    }
  }

  const totalAR = computed(() =>
    summaryList.value.reduce((sum, s) => sum + Number(s.total_amount), 0),
  )

  const overdueAmount = computed(() =>
    summaryList.value
      .filter((s) => s.status === 'overdue')
      .reduce((sum, s) => sum + Number(s.outstanding_amount), 0),
  )

  const totalPaid = computed(() =>
    summaryList.value.reduce((sum, s) => sum + Number(s.paid_amount), 0),
  )

  const outstandingAmount = computed(() =>
    summaryList.value.reduce((sum, s) => sum + Number(s.outstanding_amount), 0),
  )

  const pendingRefunds = computed(() => 0)

  return {
    summaryList,
    loading,
    totalAR,
    overdueAmount,
    totalPaid,
    outstandingAmount,
    pendingRefunds,
    fetchSummary,
  }
})
