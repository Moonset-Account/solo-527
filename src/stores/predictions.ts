import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Prediction, FunnelData } from '@/types'
import { predictionsApi } from '@/api'

export const usePredictionsStore = defineStore('predictions', () => {
  const list = ref<Prediction[]>([])
  const total = ref(0)
  const page = ref(1)
  const pageSize = ref(20)
  const loading = ref(false)
  const funnelData = ref<FunnelData[]>([])
  const riskLeads = ref<Prediction[]>([])

  async function fetchList(params?: Record<string, unknown>) {
    loading.value = true
    try {
      const { data } = await predictionsApi.list({ page: page.value, pageSize: pageSize.value, ...params })
      list.value = data.list
      total.value = data.total
    } finally {
      loading.value = false
    }
  }

  async function fetchFunnel() {
    const { data } = await predictionsApi.funnel()
    funnelData.value = data
  }

  async function fetchRisks() {
    const { data } = await predictionsApi.risks()
    riskLeads.value = data
  }

  return {
    list, total, page, pageSize, loading, funnelData, riskLeads,
    fetchList, fetchFunnel, fetchRisks,
  }
})
