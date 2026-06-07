import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Merchant, Order, Rectification, DistrictHeatData, FilterOptions } from '@/types'
import type { Metrics, ReasonAggregation, TrendDataPoint } from '@/types'
import { ClickHouseService } from '@/services/clickhouse'
import { calculateMetrics, aggregateTimeoutReasons, generateTrendData } from '@/utils/dataProcessor'

export const useAppStore = defineStore('app', () => {
  const merchants = ref<Merchant[]>([])
  const districtHeatData = ref<DistrictHeatData[]>([])
  const selectedMerchantId = ref<string | null>(null)
  const merchantOrders = ref<Order[]>([])
  const merchantRectifications = ref<Rectification[]>([])
  const overallMetrics = ref<Metrics>({
    avgPrepTime: 0,
    avgWaitTime: 0,
    avgRefundTime: 0,
    avgAcceptTime: 0,
    avgTotalTime: 0,
    orderCount: 0,
    timeoutRate: 0,
    refundRate: 0
  })
  const isLoading = ref(false)

  const filterOptions = ref<FilterOptions>({
    timeRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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

  const sortedMerchants = computed(() => {
    return [...merchants.value].sort(
      (a, b) => b.avgPrepTime + b.avgWaitTime - (a.avgPrepTime + a.avgWaitTime)
    )
  })

  async function loadOverallMetrics() {
    try {
      overallMetrics.value = await ClickHouseService.queryOverallMetrics({
        startTime: filterOptions.value.timeRange.start,
        endTime: filterOptions.value.timeRange.end,
        weather: filterOptions.value.weather,
        timePeriod: filterOptions.value.timePeriod
      })
    } catch (e) {
      console.error('Failed to load overall metrics:', e)
    }
  }

  async function loadMerchants() {
    isLoading.value = true
    try {
      merchants.value = await ClickHouseService.queryMerchants({
        startTime: filterOptions.value.timeRange.start,
        endTime: filterOptions.value.timeRange.end,
        weather: filterOptions.value.weather,
        timePeriod: filterOptions.value.timePeriod
      })
    } finally {
      isLoading.value = false
    }
  }

  async function loadDistrictHeat() {
    try {
      districtHeatData.value = await ClickHouseService.queryDistrictHeat({
        startTime: filterOptions.value.timeRange.start,
        endTime: filterOptions.value.timeRange.end,
        weather: filterOptions.value.weather,
        timePeriod: filterOptions.value.timePeriod
      })
    } catch (e) {
      console.error('Failed to load district heat:', e)
    }
  }

  async function loadMerchantOrders(merchantId: string) {
    isLoading.value = true
    try {
      merchantOrders.value = await ClickHouseService.queryOrders({
        merchantId,
        startTime: filterOptions.value.timeRange.start,
        endTime: filterOptions.value.timeRange.end,
        weather: filterOptions.value.weather,
        timePeriod: filterOptions.value.timePeriod
      })
      merchantRectifications.value = ClickHouseService.getRectifications(merchantId)
    } finally {
      isLoading.value = false
    }
  }

  function setSelectedMerchant(id: string | null) {
    selectedMerchantId.value = id
    if (id) {
      loadMerchantOrders(id)
    } else {
      merchantOrders.value = []
      merchantRectifications.value = []
    }
  }

  async function updateFilter(options: Partial<FilterOptions>) {
    filterOptions.value = { ...filterOptions.value, ...options }
    await refreshData()
  }

  async function refreshData() {
    await loadMerchants()
    await loadDistrictHeat()
    await loadOverallMetrics()
    if (selectedMerchantId.value) {
      await loadMerchantOrders(selectedMerchantId.value)
    }
  }

  function addRectification(merchantId: string, content: string, operator: string) {
    ClickHouseService.addRectification(merchantId, content, operator)
    merchantRectifications.value = ClickHouseService.getRectifications(merchantId)
  }

  async function initialize() {
    await loadMerchants()
    await loadDistrictHeat()
    await loadOverallMetrics()
  }

  return {
    merchants,
    districtHeatData,
    selectedMerchantId,
    filterOptions,
    merchantOrders,
    merchantRectifications,
    isLoading,
    overallMetrics,
    selectedMerchant,
    merchantMetrics,
    timeoutReasons,
    trendData,
    abnormalOrders,
    dataGapOrders,
    sortedMerchants,
    setSelectedMerchant,
    updateFilter,
    refreshData,
    addRectification,
    initialize,
    loadMerchants,
    loadDistrictHeat,
    loadMerchantOrders,
    loadOverallMetrics
  }
})
