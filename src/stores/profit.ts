import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchProfitSummary, fetchProfitByBatch, fetchProfitTrend, type ProfitRecord, type ProfitSummary } from '@/api/profit'

export const useProfitStore = defineStore('profit', () => {
  const summary = ref<ProfitSummary | null>(null)
  const records = ref<any[]>([])
  const trend = ref<any[]>([])
  const loading = ref(false)
  const filters = ref<Record<string, unknown>>({})

  const loadSummary = async (params?: Record<string, unknown>) => {
    loading.value = true
    try {
      const res: any = await fetchProfitSummary({ ...filters.value, ...params })
      summary.value = res
    } finally {
      loading.value = false
    }
  }

  const loadRecords = async (params?: Record<string, unknown>) => {
    loading.value = true
    try {
      const res: any = await fetchProfitByBatch({ ...filters.value, ...params })
      records.value = Array.isArray(res) ? res : []
    } finally {
      loading.value = false
    }
  }

  const loadTrend = async (params?: Record<string, unknown>) => {
    loading.value = true
    try {
      const res: any = await fetchProfitTrend({ ...filters.value, ...params })
      trend.value = Array.isArray(res) ? res : []
    } finally {
      loading.value = false
    }
  }

  return { summary, records, trend, loading, filters, loadSummary, loadRecords, loadTrend }
})
