import { defineStore } from 'pinia'
import type { CashGapForecast, CashGapForecastListResponse, FilterParams } from '~/types'

export const useCashGapStore = defineStore('cashGap', () => {
  const api = useApi()
  const forecasts = ref<CashGapForecast[]>([])
  const total = ref(0)
  const loading = ref(false)

  async function fetchList(filters: Partial<FilterParams>) {
    loading.value = true
    try {
      const res = await api.cashGap.list(filters)
      forecasts.value = res.items
      total.value = res.total
    } finally {
      loading.value = false
    }
  }

  return { forecasts, total, loading, fetchList }
})
