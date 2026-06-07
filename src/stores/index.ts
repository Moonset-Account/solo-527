import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Merchant, Order, Rectification, DistrictHeatData, FilterOptions } from '@/types'
import { mockMerchants, mockDistrictHeat, merchantOrdersMap, merchantRectificationsMap } from '@/services/mockData'
import { calculateMetrics, aggregateTimeoutReasons, generateTrendData } from '@/utils/dataProcessor'
import type { ReasonAggregation, TrendDataPoint, Metrics } from '@/types'

export const useAppStore = defineStore('app', () => {
  const merchants = ref<Merchant[]>(mockMerchants)
  const districtHeatData = ref<DistrictHeatData[]>(mockDistrictHeat)
  const selectedMerchantId = ref<string | null>(null)
  const filterOptions = ref<FilterOptions>({
    timeRange: {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    },
    weather: [],
    timePeriod: [],
    hasDataGap: null
  })

  const selectedMerchant = computed(() => {
    if (!selectedMerchantId.value) return null
    return merchants.value.find(m => m.id === selectedMerchantId.value) || null
  })

  const merchantOrders = computed((): Order[] => {
    if (!selectedMerchantId.value) return []
    let orders = merchantOrdersMap[selectedMerchantId.value] || []
    
    if (filterOptions.value.weather.length > 0) {
      orders = orders.filter(o => filterOptions.value.weather.includes(o.weather))
    }
    if (filterOptions.value.timePeriod.length > 0) {
      orders = orders.filter(o => filterOptions.value.timePeriod.includes(o.timePeriod))
    }
    if (filterOptions.value.hasDataGap !== null) {
      orders = orders.filter(o => o.hasDataGap === filterOptions.value.hasDataGap)
    }
    
    return orders
  })

  const merchantRectifications = computed((): Rectification[] => {
    if (!selectedMerchantId.value) return []
    return merchantRectificationsMap[selectedMerchantId.value] || []
  })

  const merchantMetrics = computed((): Metrics => {
    return calculateMetrics(merchantOrders.value)
  })

  const timeoutReasons = computed((): ReasonAggregation[] => {
    return aggregateTimeoutReasons(merchantOrders.value)
  })

  const trendData = computed((): TrendDataPoint[] => {
    return generateTrendData(merchantOrders.value, 7)
  })

  const abnormalOrders = computed((): Order[] => {
    return merchantOrders.value.filter(o => o.isTimeout || o.hasRefund || o.hasDataGap)
  })

  const dataGapOrders = computed((): Order[] => {
    return merchantOrders.value.filter(o => o.hasDataGap)
  })

  const overallMetrics = computed(() => {
    const allOrders = Object.values(merchantOrdersMap).flat()
    return calculateMetrics(allOrders)
  })

  const sortedMerchants = computed(() => {
    return [...merchants.value].sort((a, b) => (b.avgPrepTime + b.avgWaitTime) - (a.avgPrepTime + a.avgWaitTime))
  })

  function setSelectedMerchant(id: string | null) {
    selectedMerchantId.value = id
  }

  function updateFilter(options: Partial<FilterOptions>) {
    filterOptions.value = { ...filterOptions.value, ...options }
  }

  function addRectification(merchantId: string, content: string, operator: string) {
    const now = new Date()
    const beforeStart = new Date(now)
    beforeStart.setDate(beforeStart.getDate() - 14)
    const beforeEnd = new Date(now)
    beforeEnd.setDate(beforeEnd.getDate() - 1)
    const afterStart = new Date(now)
    afterStart.setDate(afterStart.getDate() + 1)
    const afterEnd = new Date(now)
    afterEnd.setDate(afterEnd.getDate() + 14)

    const newRect: Rectification = {
      id: `rect_${merchantId}_${Date.now()}`,
      merchantId,
      createTime: now.toISOString(),
      content,
      operator,
      beforePeriodStart: beforeStart.toISOString(),
      beforePeriodEnd: beforeEnd.toISOString(),
      afterPeriodStart: afterStart.toISOString(),
      afterPeriodEnd: afterEnd.toISOString()
    }

    if (!merchantRectificationsMap[merchantId]) {
      merchantRectificationsMap[merchantId] = []
    }
    merchantRectificationsMap[merchantId].unshift(newRect)
    
    if (merchantRectificationsMap[merchantId].length > 3) {
      merchantRectificationsMap[merchantId] = merchantRectificationsMap[merchantId].slice(0, 3)
    }
  }

  return {
    merchants,
    districtHeatData,
    selectedMerchantId,
    filterOptions,
    selectedMerchant,
    merchantOrders,
    merchantRectifications,
    merchantMetrics,
    timeoutReasons,
    trendData,
    abnormalOrders,
    dataGapOrders,
    overallMetrics,
    sortedMerchants,
    setSelectedMerchant,
    updateFilter,
    addRectification
  }
})
