import { defineStore } from 'pinia'
import type { ARRecord, ARRecordSummary, ARRecordListResponse, FilterParams } from '~/types'

export const useArStore = defineStore('ar', () => {
  const api = useApi()
  const records = ref<ARRecord[]>([])
  const summary = ref<ARRecordSummary | null>(null)
  const currentRecord = ref<ARRecord | null>(null)
  const total = ref(0)
  const loading = ref(false)

  async function fetchList(filters: Partial<FilterParams>) {
    loading.value = true
    try {
      const res = await api.ar.list(filters)
      records.value = res.items
      total.value = res.total
      if (res.summary) summary.value = res.summary
    } finally {
      loading.value = false
    }
  }

  async function fetchSummary() {
    try {
      summary.value = await api.ar.summary()
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
      currentRecord.value = await api.ar.drillDown(id)
    } finally {
      loading.value = false
    }
  }

  return { records, summary, currentRecord, total, loading, fetchList, fetchSummary, fetchById, fetchDrillDown }
})
