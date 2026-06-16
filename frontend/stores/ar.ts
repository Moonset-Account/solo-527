import { defineStore } from 'pinia'
import type { ARRecord, ARRecordSummary, ARRecordListResponse, FilterParams } from '~/types'

export const useArStore = defineStore('ar', () => {
  const api = useApi()
  const records = ref<ARRecord[]>([])
  const summaryList = ref<ARRecordSummary[]>([])
  const summaryAggregate = ref<{ total_amount: number; paid_amount: number; outstanding_amount: number }>({
    total_amount: 0,
    paid_amount: 0,
    outstanding_amount: 0,
  })
  const currentRecord = ref<ARRecord | null>(null)
  const total = ref(0)
  const loading = ref(false)

  async function fetchList(filters: Partial<FilterParams>) {
    loading.value = true
    try {
      const res = await api.ar.list(filters)
      records.value = res.items
      total.value = res.total
    } finally {
      loading.value = false
    }
  }

  async function fetchSummary() {
    try {
      const summaries = await api.ar.summary()
      summaryList.value = summaries
      summaryAggregate.value = summaries.reduce(
        (acc, s) => ({
          total_amount: acc.total_amount + Number(s.total_amount),
          paid_amount: acc.paid_amount + Number(s.paid_amount),
          outstanding_amount: acc.outstanding_amount + Number(s.outstanding_amount),
        }),
        { total_amount: 0, paid_amount: 0, outstanding_amount: 0 },
      )
    } catch (e) {
      console.error('Failed to fetch AR summary', e)
    }
  }

  async function fetchById(id: string) {
    loading.value = true
    try {
      currentRecord.value = await api.ar.get(id)
    } finally {
      loading.value = false
    }
  }

  async function fetchDrillDown(id: string) {
    loading.value = true
    try {
      currentRecord.value = await api.ar.get(id)
    } finally {
      loading.value = false
    }
  }

  return {
    records,
    summaryList,
    summaryAggregate,
    currentRecord,
    total,
    loading,
    fetchList,
    fetchSummary,
    fetchById,
    fetchDrillDown,
  }
})
