import type { Merchant, Order, Rectification, DistrictHeatData, Metrics } from '@/types'
import { generateMockMerchants, generateMockOrders } from './mockDataGenerator'
import { STORAGE_KEYS, THRESHOLDS } from '@/constants'

const MERCHANTS_CACHE_KEY = 'ch_merchants_v3'
const ORDERS_CACHE_KEY = 'ch_orders_table_v3'
const CACHE_EXPIRE_MS = 10 * 60 * 1000

interface CacheEntry<T> {
  data: T
  timestamp: number
}

interface QueryResult<T> {
  data: T[]
  meta: {
    rows: number
    execution_time_ms: number
  }
}

interface OrderTableRow {
  order_id: string
  merchant_id: string
  order_no: string
  create_time: string
  accept_time: string
  prep_start_time: string
  rider_arrive_time?: string
  pickup_time: string
  deliver_time?: string
  refund_time?: string
  prep_duration: number
  wait_duration?: number
  refund_duration?: number
  is_timeout: number
  timeout_reason?: string
  weather: string
  time_period: string
  rider_remark?: string
  has_data_gap: number
  has_refund: number
  refund_reason?: string
  business_district: string
  merchant_name: string
}

interface ParsedSQL {
  select: string[]
  from: string
  where: Array<{ field: string; op: string; value: any }>
  groupBy: string[]
  orderBy?: { field: string; desc: boolean }
  limit?: number
}

const TABLES: Record<string, keyof typeof dataStore> = {
  'orders': 'orders',
  'merchants': 'merchants'
}

const dataStore = {
  orders: [] as OrderTableRow[],
  merchants: [] as Merchant[]
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
    const entry: CacheEntry<T> = { data, timestamp: Date.now() }
    localStorage.setItem(key, JSON.stringify(entry))
  } catch {
    // ignore
  }
}

let isInitialized = false

function ensureTablesInitialized() {
  if (isInitialized) return

  const cachedMerchants = getCache<Merchant[]>(MERCHANTS_CACHE_KEY)
  const cachedOrders = getCache<OrderTableRow[]>(ORDERS_CACHE_KEY)

  if (cachedMerchants && cachedOrders) {
    dataStore.merchants = cachedMerchants
    dataStore.orders = cachedOrders
    isInitialized = true
    return
  }

  dataStore.merchants = generateMockMerchants()
  dataStore.orders = []

  dataStore.merchants.forEach(m => {
    const rawOrders = generateMockOrders(m.id, 150)
    rawOrders.forEach(o => {
      const row: OrderTableRow = {
        order_id: o.id,
        merchant_id: o.merchantId,
        merchant_name: m.name,
        order_no: o.orderNo,
        create_time: o.createTime,
        accept_time: o.acceptTime,
        prep_start_time: o.prepStartTime,
        rider_arrive_time: o.riderArriveTime,
        pickup_time: o.pickupTime,
        deliver_time: o.deliverTime,
        refund_time: (o as any).refundTime,
        prep_duration: o.prepDuration,
        wait_duration: o.waitDuration,
        refund_duration: (o as any).refundDuration,
        is_timeout: o.isTimeout ? 1 : 0,
        timeout_reason: o.timeoutReason,
        weather: o.weather,
        time_period: o.timePeriod,
        rider_remark: o.riderRemark,
        has_data_gap: o.hasDataGap ? 1 : 0,
        has_refund: o.hasRefund ? 1 : 0,
        refund_reason: o.refundReason,
        business_district: m.businessDistrict
      }
      dataStore.orders.push(row)
    })
  })

  setCache(MERCHANTS_CACHE_KEY, dataStore.merchants)
  setCache(ORDERS_CACHE_KEY, dataStore.orders)
  isInitialized = true
}

function parseSQL(sql: string): ParsedSQL {
  const cleaned = sql.replace(/\s+/g, ' ').trim()
  const result: ParsedSQL = {
    select: [],
    from: 'orders',
    where: [],
    groupBy: []
  }

  const selectMatch = cleaned.match(/SELECT\s+(.+?)\s+FROM/i)
  if (selectMatch) {
    result.select = selectMatch[1].split(',').map(s => s.trim().toLowerCase())
  }

  const fromMatch = cleaned.match(/FROM\s+(\w+)/i)
  if (fromMatch) {
    result.from = fromMatch[1].toLowerCase()
  }

  const whereMatch = cleaned.match(/WHERE\s+(.+?)(GROUP|ORDER|LIMIT|$)/i)
  if (whereMatch) {
    const whereStr = whereMatch[1].trim()
    const conditions = whereStr.split(/\s+AND\s+/i)
    conditions.forEach(cond => {
      const match = cond.match(/(\w+)\s*(=|!=|>|<|>=|<=|IN|LIKE)\s*(.+)/i)
      if (match) {
        let value = match[3].trim()
        if (value.startsWith("'") && value.endsWith("'")) {
          value = value.slice(1, -1)
        } else if (value === '1' || value === '0') {
          value = parseInt(value)
        }
        result.where.push({
          field: match[1].toLowerCase(),
          op: match[2].toUpperCase(),
          value
        })
      }
    })
  }

  const groupMatch = cleaned.match(/GROUP\s+BY\s+(.+?)(ORDER|LIMIT|$)/i)
  if (groupMatch) {
    result.groupBy = groupMatch[1].split(',').map(s => s.trim().toLowerCase())
  }

  const orderMatch = cleaned.match(/ORDER\s+BY\s+(\w+)\s*(DESC|ASC)?/i)
  if (orderMatch) {
    result.orderBy = {
      field: orderMatch[1].toLowerCase(),
      desc: (orderMatch[2] || 'DESC').toUpperCase() === 'DESC'
    }
  }

  const limitMatch = cleaned.match(/LIMIT\s+(\d+)/i)
  if (limitMatch) {
    result.limit = parseInt(limitMatch[1])
  }

  return result
}

function getFieldValue(row: any, field: string): any {
  const aggMatch = field.match(/(count|avg|sum|min|max)\((.+)\)/i)
  if (aggMatch) {
    return { type: 'agg', func: aggMatch[1].toUpperCase(), field: aggMatch[2] === '*' ? '*' : aggMatch[2] }
  }
  return row[field]
}

function applyWhere(row: any, conditions: ParsedSQL['where']): boolean {
  for (const cond of conditions) {
    const val = row[cond.field]
    switch (cond.op) {
      case '=':
        if (val !== cond.value) return false
        break
      case '!=':
        if (val === cond.value) return false
        break
      case '>':
        if (val <= cond.value) return false
        break
      case '<':
        if (val >= cond.value) return false
        break
      case '>=':
        if (val < cond.value) return false
        break
      case '<=':
        if (val > cond.value) return false
        break
      case 'IN':
        const values = String(cond.value).split(',').map(v => v.trim())
        if (!values.includes(String(val))) return false
        break
    }
  }
  return true
}

function executeParsedQuery(parsed: ParsedSQL): any[] {
  const tableName = TABLES[parsed.from] || 'orders'
  let rows = [...dataStore[tableName as 'orders']]

  rows = rows.filter(row => applyWhere(row, parsed.where))

  if (parsed.groupBy.length > 0) {
    const groups: Record<string, any[]> = {}
    rows.forEach(row => {
      const key = parsed.groupBy.map(g => row[g]).join('|')
      if (!groups[key]) groups[key] = []
      groups[key].push(row)
    })

    const result: any[] = []
    Object.entries(groups).forEach(([key, groupRows]) => {
      const item: any = {}
      const keyParts = key.split('|')
      parsed.groupBy.forEach((g, i) => {
        item[g] = keyParts[i]
      })

      parsed.select.forEach(field => {
        const aggMatch = field.match(/(count|avg|sum|min|max)\((.+)\)/i)
        if (aggMatch) {
          const func = aggMatch[1].toUpperCase()
          const f = aggMatch[2]
          switch (func) {
            case 'COUNT':
              item[field] = groupRows.length
              break
            case 'AVG': {
              const nums = groupRows.map(r => Number(r[f]) || 0).filter(n => !isNaN(n))
              item[field] = nums.length > 0 ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : 0
              break
            }
            case 'SUM':
              item[field] = Math.round(groupRows.reduce((sum, r) => sum + (Number(r[f]) || 0), 0))
              break
            case 'MIN':
              item[field] = Math.min(...groupRows.map(r => Number(r[f]) || Infinity))
              break
            case 'MAX':
              item[field] = Math.max(...groupRows.map(r => Number(r[f]) || -Infinity))
              break
          }
        }
      })
      result.push(item)
    })
    rows = result
  }

  if (parsed.orderBy) {
    rows.sort((a, b) => {
      const aVal = a[parsed.orderBy!.field]
      const bVal = b[parsed.orderBy!.field]
      const cmp = aVal > bVal ? 1 : aVal < bVal ? -1 : 0
      return parsed.orderBy!.desc ? -cmp : cmp
    })
  }

  if (parsed.limit) {
    rows = rows.slice(0, parsed.limit)
  }

  return rows
}

function executeQuery<T>(queryFn: () => T[]): QueryResult<T> {
  const startTime = Date.now()
  const data = queryFn()
  return {
    data,
    meta: {
      rows: data.length,
      execution_time_ms: Date.now() - startTime
    }
  }
}

interface QueryConditions {
  merchantId?: string
  startTime?: string
  endTime?: string
  weather?: string[]
  timePeriod?: string[]
  hasDataGap?: boolean | null
  isTimeout?: boolean | null
  hasRefund?: boolean | null
}

function applyWhereConditions(rows: OrderTableRow[], cond: QueryConditions): OrderTableRow[] {
  return rows.filter(row => {
    if (cond.merchantId && row.merchant_id !== cond.merchantId) return false

    if (cond.startTime) {
      if (new Date(row.create_time) < new Date(cond.startTime)) return false
    }
    if (cond.endTime) {
      const end = new Date(cond.endTime)
      end.setHours(23, 59, 59, 999)
      if (new Date(row.create_time) > end) return false
    }

    if (cond.weather && cond.weather.length > 0) {
      if (!cond.weather.includes(row.weather)) return false
    }

    if (cond.timePeriod && cond.timePeriod.length > 0) {
      if (!cond.timePeriod.includes(row.time_period)) return false
    }

    if (cond.hasDataGap !== undefined && cond.hasDataGap !== null) {
      if (row.has_data_gap !== (cond.hasDataGap ? 1 : 0)) return false
    }

    if (cond.isTimeout !== undefined && cond.isTimeout !== null) {
      if (row.is_timeout !== (cond.isTimeout ? 1 : 0)) return false
    }

    if (cond.hasRefund !== undefined && cond.hasRefund !== null) {
      if (row.has_refund !== (cond.hasRefund ? 1 : 0)) return false
    }

    return true
  })
}

function rowToOrder(row: OrderTableRow): Order {
  return {
    id: row.order_id,
    merchantId: row.merchant_id,
    orderNo: row.order_no,
    createTime: row.create_time,
    acceptTime: row.accept_time,
    prepStartTime: row.prep_start_time,
    riderArriveTime: row.rider_arrive_time,
    pickupTime: row.pickup_time,
    deliverTime: row.deliver_time,
    refundTime: row.refund_time,
    prepDuration: row.prep_duration,
    waitDuration: row.wait_duration,
    refundDuration: row.refund_duration,
    isTimeout: row.is_timeout === 1,
    timeoutReason: row.timeout_reason,
    weather: row.weather,
    timePeriod: row.time_period,
    riderRemark: row.rider_remark,
    hasDataGap: row.has_data_gap === 1,
    hasRefund: row.has_refund === 1,
    refundReason: row.refund_reason
  }
}

function calculateMetricsFromRows(rows: OrderTableRow[]): Metrics {
  const prepRows = rows.filter(r => r.prep_duration > 0)
  const waitRows = rows.filter(r => r.wait_duration !== undefined && r.has_data_gap === 0)
  const refundRows = rows.filter(r => r.refund_duration !== undefined && r.has_refund === 1)
  const acceptRows = rows.filter(r => r.accept_time && r.create_time)

  const avgPrepTime = prepRows.length > 0
    ? Math.round(prepRows.reduce((sum, r) => sum + r.prep_duration, 0) / prepRows.length)
    : 0

  const avgWaitTime = waitRows.length > 0
    ? Math.round(waitRows.reduce((sum, r) => sum + (r.wait_duration || 0), 0) / waitRows.length)
    : 0

  const avgRefundTime = refundRows.length > 0
    ? Math.round(refundRows.reduce((sum, r) => sum + (r.refund_duration || 0), 0) / refundRows.length)
    : 0

  const avgAcceptTime = acceptRows.length > 0
    ? Math.round(acceptRows.reduce((sum, r) => {
        const diff = (new Date(r.accept_time).getTime() - new Date(r.create_time).getTime()) / 60000
        return sum + Math.max(0, diff)
      }, 0) / acceptRows.length)
    : 0

  const avgTotalTime = rows.length > 0
    ? Math.round(rows.reduce((sum, r) => sum + r.prep_duration + (r.wait_duration || 0), 0) / rows.length)
    : 0

  const timeoutCount = rows.filter(r => r.is_timeout === 1).length
  const refundCount = rows.filter(r => r.has_refund === 1).length

  return {
    avgPrepTime,
    avgWaitTime,
    avgRefundTime,
    avgAcceptTime,
    avgTotalTime,
    orderCount: rows.length,
    timeoutRate: rows.length > 0 ? +(timeoutCount / rows.length * 100).toFixed(1) : 0,
    refundRate: rows.length > 0 ? +(refundCount / rows.length * 100).toFixed(1) : 0
  }
}

function simulateImprovedMetrics(metrics: Metrics): Metrics {
  const improveRate = 0.8 + Math.random() * 0.15
  return {
    ...metrics,
    avgPrepTime: Math.max(1, Math.round(metrics.avgPrepTime * improveRate)),
    avgWaitTime: Math.max(1, Math.round(metrics.avgWaitTime * improveRate)),
    avgTotalTime: Math.max(2, Math.round(metrics.avgTotalTime * improveRate)),
    timeoutRate: Math.max(0, +(metrics.timeoutRate * improveRate).toFixed(1)),
    refundRate: Math.max(0, +(metrics.refundRate * improveRate).toFixed(1))
  }
}

export const ClickHouseService = {
  async query<T>(sql: string, params?: Record<string, any>): Promise<QueryResult<T>> {
    ensureTablesInitialized()
    await new Promise(resolve => setTimeout(resolve, 20 + Math.random() * 50))

    const parsed = parseSQL(sql)
    return executeQuery(() => executeParsedQuery(parsed) as T[])
  },

  async queryOrders(conditions: QueryConditions = {}): Promise<Order[]> {
    ensureTablesInitialized()
    const result = executeQuery(() => applyWhereConditions(dataStore.orders, conditions))
    return result.data.map(rowToOrder).sort(
      (a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime()
    )
  },

  async queryMerchants(conditions: QueryConditions = {}): Promise<Merchant[]> {
    ensureTablesInitialized()
    const filteredOrders = applyWhereConditions(dataStore.orders, conditions)

    return dataStore.merchants.map(m => {
      const mOrders = filteredOrders.filter(o => o.merchant_id === m.id)
      const metrics = calculateMetricsFromRows(mOrders)
      const dataGapCount = mOrders.filter(o => o.has_data_gap === 1).length

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

  async queryMerchantMetrics(merchantId: string, conditions: QueryConditions = {}): Promise<Metrics> {
    ensureTablesInitialized()
    const rows = applyWhereConditions(dataStore.orders, { ...conditions, merchantId })
    return calculateMetricsFromRows(rows)
  },

  async queryOverallMetrics(conditions: QueryConditions = {}): Promise<Metrics> {
    ensureTablesInitialized()
    const rows = applyWhereConditions(dataStore.orders, conditions)
    return calculateMetricsFromRows(rows)
  },

  async queryDistrictHeat(conditions: QueryConditions = {}): Promise<DistrictHeatData[]> {
    ensureTablesInitialized()
    const filteredOrders = applyWhereConditions(dataStore.orders, conditions)

    const districtGroups: Record<string, OrderTableRow[]> = {}
    dataStore.merchants.forEach(m => {
      if (!districtGroups[m.businessDistrict]) {
        districtGroups[m.businessDistrict] = []
      }
    })

    filteredOrders.forEach(o => {
      if (districtGroups[o.business_district]) {
        districtGroups[o.business_district].push(o)
      }
    })

    return Object.entries(districtGroups).map(([name, rows]) => {
      const metrics = calculateMetricsFromRows(rows)
      const sampleMerchant = dataStore.merchants.find(m => m.businessDistrict === name)
      return {
        name,
        value: metrics.avgTotalTime,
        center: sampleMerchant
          ? [sampleMerchant.longitude, sampleMerchant.latitude]
          : [116.4, 39.9]
      }
    })
  },

  async queryTimeoutReasons(conditions: QueryConditions = {}): Promise<{ reason: string; count: number; percentage: number }[]> {
    ensureTablesInitialized()
    const rows = applyWhereConditions(dataStore.orders, { ...conditions, isTimeout: true })
    const groups: Record<string, number> = {}

    rows.forEach(r => {
      const reason = r.timeout_reason || '其他原因'
      groups[reason] = (groups[reason] || 0) + 1
    })

    const total = rows.length
    return Object.entries(groups)
      .map(([reason, count]) => ({
        reason,
        count,
        percentage: total > 0 ? +(count / total * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.count - a.count)
  },

  async queryOrderTimelineAvg(merchantId: string, conditions: QueryConditions = {}): Promise<{
    avgAcceptTime: number
    avgPrepStartTime: number
    avgRiderArriveTime: number
    avgPickupTime: number
  }> {
    ensureTablesInitialized()
    const rows = applyWhereConditions(dataStore.orders, { ...conditions, merchantId })
    const validRows = rows.filter(r => !r.has_data_gap)

    if (validRows.length === 0) {
      return { avgAcceptTime: 1, avgPrepStartTime: 2, avgRiderArriveTime: 7, avgPickupTime: 12 }
    }

    const sumAccept = validRows.reduce((sum, r) => {
      const diff = (new Date(r.accept_time).getTime() - new Date(r.create_time).getTime()) / 60000
      return sum + Math.max(0, diff)
    }, 0)

    const sumPrep = validRows.reduce((sum, r) => {
      const diff = (new Date(r.prep_start_time).getTime() - new Date(r.create_time).getTime()) / 60000
      return sum + Math.max(0, diff)
    }, 0)

    const sumRider = validRows.reduce((sum, r) => {
      if (!r.rider_arrive_time) return sum
      const diff = (new Date(r.rider_arrive_time).getTime() - new Date(r.create_time).getTime()) / 60000
      return sum + Math.max(0, diff)
    }, 0)

    const sumPickup = validRows.reduce((sum, r) => {
      const diff = (new Date(r.pickup_time).getTime() - new Date(r.create_time).getTime()) / 60000
      return sum + Math.max(0, diff)
    }, 0)

    const n = validRows.length
    return {
      avgAcceptTime: Math.round(sumAccept / n),
      avgPrepStartTime: Math.round(sumPrep / n),
      avgRiderArriveTime: Math.round(sumRider / n),
      avgPickupTime: Math.round(sumPickup / n)
    }
  },

  getRectifications(merchantId: string): Rectification[] {
    ensureTablesInitialized()
    try {
      const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.RECTIFICATIONS) || '{}')
      const list: Rectification[] = all[merchantId] || []

      return list
        .map((r: Rectification) => ({
          ...r,
          beforeMetrics: this.calculateMetricsForPeriod(merchantId, r.beforePeriodStart, r.beforePeriodEnd),
          afterMetrics: this.calculateMetricsForPeriod(merchantId, r.afterPeriodStart, r.afterPeriodEnd)
        }))
        .sort(
          (a: Rectification, b: Rectification) =>
            new Date(b.createTime).getTime() - new Date(a.createTime).getTime()
        )
        .slice(0, 3)
    } catch {
      return []
    }
  },

  calculateMetricsForPeriod(merchantId: string, start: string, end: string): Metrics {
    ensureTablesInitialized()
    const rows = applyWhereConditions(dataStore.orders, {
      merchantId,
      startTime: start,
      endTime: end
    })

    if (rows.length === 0) {
      const allRows = applyWhereConditions(dataStore.orders, { merchantId })
      const allMetrics = calculateMetricsFromRows(allRows)
      return simulateImprovedMetrics(allMetrics)
    }

    return calculateMetricsFromRows(rows)
  },

  addRectification(merchantId: string, content: string, operator: string): Rectification {
    ensureTablesInitialized()
    const now = new Date()
    const beforeStart = new Date(now)
    beforeStart.setDate(beforeStart.getDate() - 28)
    const beforeEnd = new Date(now)
    beforeEnd.setDate(beforeEnd.getDate() - 15)
    const afterStart = new Date(now)
    afterStart.setDate(afterStart.getDate() - 14)
    const afterEnd = new Date(now)

    const beforeMetrics = this.calculateMetricsForPeriod(
      merchantId,
      beforeStart.toISOString(),
      beforeEnd.toISOString()
    )
    const afterBaseMetrics = this.calculateMetricsForPeriod(
      merchantId,
      afterStart.toISOString(),
      afterEnd.toISOString()
    )
    const afterMetrics = simulateImprovedMetrics(afterBaseMetrics)

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
      beforeMetrics,
      afterMetrics
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
    ensureTablesInitialized()
    return dataStore.orders.map(row => ({
      ...rowToOrder(row),
      merchantName: row.merchant_name,
      merchantId: row.merchant_id,
      businessDistrict: row.business_district
    }))
  },

  clearCache() {
    localStorage.removeItem(MERCHANTS_CACHE_KEY)
    localStorage.removeItem(ORDERS_CACHE_KEY)
    dataStore.orders = []
    dataStore.merchants = []
    isInitialized = false
  }
}

