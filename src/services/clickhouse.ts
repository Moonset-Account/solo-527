import type { Merchant, Order, Rectification, DistrictHeatData, Metrics, FilterOptions } from '@/types'
import { generateMockMerchants, generateMockOrders, generateMockRectifications } from './mockDataGenerator'
import { cleanOrderData, calculateMetrics } from '@/utils/dataProcessor'
import { STORAGE_KEYS } from '@/constants'

const MERCHANTS_CACHE_KEY = 'ch_merchants_cache'
const ORDERS_CACHE_KEY = 'ch_orders_cache'
const CACHE_EXPIRE_MS = 5 * 60 * 1000

interface CacheEntry<T> {
  data: T
  timestamp: number
}

function getCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const entry: CacheEntry<T> = JSON.parse(raw)
    if (Date.now() - entry.timestamp > CACHE_EXPIRE_MS) {
      localStorage.removeItem(key)
      return null
    }
    return entry.data
  } catch {
    return null
  }
}

function setCache<T>(key: string, data: T) {
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now()
    }
    localStorage.setItem(key, JSON.stringify(entry))
  } catch {
    // ignore
  }
}

let merchantsData: Merchant[] = []
let allOrders: Order[] = []
let merchantOrdersMap: Record<string, Order[]> = {}

function ensureDataInitialized() {
  if (merchantsData.length > 0) return

  const cachedMerchants = getCache<Merchant[]>(MERCHANTS_CACHE_KEY)
  const cachedOrders = getCache<Order[]>(ORDERS_CACHE_KEY)

  if (cachedMerchants && cachedOrders) {
    merchantsData = cachedMerchants
    allOrders = cachedOrders
  } else {
    merchantsData = generateMockMerchants()
    allOrders = []
    merchantsData.forEach(m => {
      const orders = generateMockOrders(m.id, 120)
      allOrders = allOrders.concat(orders)
    })
    setCache(MERCHANTS_CACHE_KEY, merchantsData)
    setCache(ORDERS_CACHE_KEY, allOrders)
  }

  merchantOrdersMap = {}
  allOrders.forEach(o => {
    if (!merchantOrdersMap[o.merchantId]) {
      merchantOrdersMap[o.merchantId] = []
    }
    merchantOrdersMap[o.merchantId].push(o)
  })
}

export interface QueryOrdersParams {
  merchantId?: string
  startTime?: string
  endTime?: string
  weather?: string[]
  timePeriod?: string[]
  hasDataGap?: boolean | null
  isTimeout?: boolean | null
  hasRefund?: boolean | null
}

export interface QueryMerchantsParams {
  businessDistrict?: string
  startTime?: string
  endTime?: string
  weather?: string[]
  timePeriod?: string[]
}

export interface QueryDistrictHeatParams {
  startTime?: string
  endTime?: string
  weather?: string[]
  timePeriod?: string[]
}

function filterOrders(orders: Order[], params: QueryOrdersParams): Order[] {
  return orders.filter(o => {
    if (params.merchantId && o.merchantId !== params.merchantId) return false

    if (params.startTime) {
      if (new Date(o.createTime) < new Date(params.startTime)) return false
    }
    if (params.endTime) {
      const end = new Date(params.endTime)
      end.setHours(23, 59, 59, 999)
      if (new Date(o.createTime) > end) return false
    }

    if (params.weather && params.weather.length > 0) {
      if (!params.weather.includes(o.weather)) return false
    }

    if (params.timePeriod && params.timePeriod.length > 0) {
      if (!params.timePeriod.includes(o.timePeriod)) return false
    }

    if (params.hasDataGap !== undefined && params.hasDataGap !== null) {
      if (o.hasDataGap !== params.hasDataGap) return false
    }

    if (params.isTimeout !== undefined && params.isTimeout !== null) {
      if (o.isTimeout !== params.isTimeout) return false
    }

    if (params.hasRefund !== undefined && params.hasRefund !== null) {
      if (o.hasRefund !== params.hasRefund) return false
    }

    return true
  })
}

export const ClickHouseService = {
  async queryMerchants(params: QueryMerchantsParams = {}): Promise<Merchant[]> {
    ensureDataInitialized()

    let filteredOrders = allOrders
    if (params.startTime || params.endTime || params.weather || params.timePeriod) {
      filteredOrders = filterOrders(allOrders, {
        startTime: params.startTime,
        endTime: params.endTime,
        weather: params.weather,
        timePeriod: params.timePeriod
      })
    }

    return merchantsData.map(m => {
      const mOrders = filteredOrders.filter(o => o.merchantId === m.id)
      const metrics = calculateMetrics(mOrders)
      const dataGapCount = mOrders.filter(o => o.hasDataGap).length

      return {
        ...m,
        avgPrepTime: metrics.avgPrepTime,
        avgWaitTime: metrics.avgWaitTime,
        orderCount: metrics.orderCount,
        refundRate: metrics.refundRate,
        dataGapCount
      }
    })
  },

  async queryOrders(params: QueryOrdersParams = {}): Promise<Order[]> {
    ensureDataInitialized()
    let orders = allOrders
    if (params.merchantId) {
      orders = merchantOrdersMap[params.merchantId] || []
    }
    return filterOrders(orders, params).sort(
      (a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime()
    )
  },

  async queryMerchantMetrics(merchantId: string, params: QueryOrdersParams = {}): Promise<Metrics> {
    const orders = await this.queryOrders({ ...params, merchantId })
    return calculateMetrics(orders)
  },

  async queryDistrictHeat(params: QueryDistrictHeatParams = {}): Promise<DistrictHeatData[]> {
    ensureDataInitialized()

    const filteredOrders = filterOrders(allOrders, {
      startTime: params.startTime,
      endTime: params.endTime,
      weather: params.weather,
      timePeriod: params.timePeriod
    })

    const districtGroups: Record<string, Order[]> = {}
    merchantsData.forEach(m => {
      if (!districtGroups[m.businessDistrict]) {
        districtGroups[m.businessDistrict] = []
      }
    })

    filteredOrders.forEach(o => {
      const merchant = merchantsData.find(m => m.id === o.merchantId)
      if (merchant && districtGroups[merchant.businessDistrict]) {
        districtGroups[merchant.businessDistrict].push(o)
      }
    })

    return Object.entries(districtGroups).map(([name, orders]) => {
      const metrics = calculateMetrics(orders)
      const sampleMerchant = merchantsData.find(m => m.businessDistrict === name)
      return {
        name,
        value: metrics.avgPrepTime + metrics.avgWaitTime,
        center: sampleMerchant
          ? [sampleMerchant.longitude, sampleMerchant.latitude]
          : [116.4, 39.9]
      }
    })
  },

  getRectifications(merchantId: string): Rectification[] {
    try {
      const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.RECTIFICATIONS) || '{}')
      const list = all[merchantId] || []
      return list
        .filter((r: Rectification) => {
          const orders = merchantOrdersMap[merchantId] || []
          r.beforeMetrics = this.calculateRectificationMetrics(
            merchantId,
            r.beforePeriodStart,
            r.beforePeriodEnd
          )
          r.afterMetrics = this.calculateRectificationMetrics(
            merchantId,
            r.afterPeriodStart,
            r.afterPeriodEnd
          )
          return true
        })
        .sort(
          (a: Rectification, b: Rectification) =>
            new Date(b.createTime).getTime() - new Date(a.createTime).getTime()
        )
        .slice(0, 3)
    } catch {
      return []
    }
  },

  calculateRectificationMetrics(
    merchantId: string,
    start: string,
    end: string
  ): Metrics {
    ensureDataInitialized()
    const orders = filterOrders(merchantOrdersMap[merchantId] || [], {
      startTime: start,
      endTime: end
    })
    return calculateMetrics(orders)
  },

  addRectification(
    merchantId: string,
    content: string,
    operator: string
  ): Rectification {
    ensureDataInitialized()
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
      afterPeriodEnd: afterEnd.toISOString(),
      beforeMetrics: this.calculateRectificationMetrics(
        merchantId,
        beforeStart.toISOString(),
        beforeEnd.toISOString()
      ),
      afterMetrics: this.calculateRectificationMetrics(
        merchantId,
        afterStart.toISOString(),
        afterEnd.toISOString()
      )
    }

    try {
      const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.RECTIFICATIONS) || '{}')
      if (!all[merchantId]) {
        all[merchantId] = []
      }
      all[merchantId].unshift(newRect)
      all[merchantId] = all[merchantId].slice(0, 3)
      localStorage.setItem(STORAGE_KEYS.RECTIFICATIONS, JSON.stringify(all))
    } catch {
      // ignore
    }

    return newRect
  },

  async getAllOrdersWithMerchantInfo(): Promise<any[]> {
    ensureDataInitialized()
    return allOrders.map(o => {
      const m = merchantsData.find(mer => mer.id === o.merchantId)
      return {
        ...o,
        merchantName: m?.name || '',
        merchantId: o.merchantId
      }
    })
  },

  clearCache() {
    localStorage.removeItem(MERCHANTS_CACHE_KEY)
    localStorage.removeItem(ORDERS_CACHE_KEY)
    merchantsData = []
    allOrders = []
    merchantOrdersMap = {}
  }
}
