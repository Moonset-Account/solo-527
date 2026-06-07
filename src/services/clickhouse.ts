import type { Merchant, Order, Rectification, DistrictHeatData, Metrics } from '@/types'
import { generateMockMerchants } from './mockDataGenerator'
import {
  STORAGE_KEYS,
  THRESHOLDS,
  WEATHER_CATEGORY_MAP
} from '@/constants'

const CH_CACHE_KEY = 'clickhouse_instance_v4'
const CACHE_EXPIRE_MS = 10 * 60 * 1000

interface ClickHouseConfig {
  host: string
  port: number
  database: string
  username: string
}

interface QueryResult<T> {
  data: T[]
  meta: {
    rows: number
    bytes: number
    elapsed: number
  }
}

interface TableDefinition {
  name: string
  engine: string
  columns: Record<string, string>
  partitionBy?: string
  orderBy: string
  ttl?: string
}

const TABLES: Record<string, TableDefinition> = {
  orders_raw: {
    name: 'orders_raw',
    engine: 'MergeTree',
    columns: {
      order_id: 'String',
      merchant_id: 'String',
      order_no: 'String',
      create_time: 'DateTime',
      accept_time: 'DateTime',
      prep_start_time: 'DateTime',
      rider_arrive_time: 'Nullable(DateTime)',
      pickup_time: 'DateTime',
      deliver_time: 'Nullable(DateTime)',
      refund_time: 'Nullable(DateTime)',
      weather: 'String',
      time_period: 'String',
      rider_remark: 'Nullable(String)',
      has_refund: 'UInt8',
      refund_reason: 'Nullable(String)'
    },
    partitionBy: 'toYYYYMM(create_time)',
    orderBy: '(merchant_id, create_time)'
  },
  orders_clean: {
    name: 'orders_clean',
    engine: 'MergeTree',
    columns: {
      order_id: 'String',
      merchant_id: 'String',
      merchant_name: 'String',
      business_district: 'String',
      order_no: 'String',
      create_time: 'DateTime',
      accept_time: 'DateTime',
      prep_start_time: 'DateTime',
      rider_arrive_time: 'Nullable(DateTime)',
      pickup_time: 'DateTime',
      deliver_time: 'Nullable(DateTime)',
      refund_time: 'Nullable(DateTime)',
      prep_duration: 'Int32',
      wait_duration: 'Nullable(Int32)',
      refund_duration: 'Nullable(Int32)',
      accept_duration: 'Int32',
      total_duration: 'Int32',
      is_timeout: 'UInt8',
      timeout_reason: 'Nullable(String)',
      weather: 'String',
      weather_category: 'String',
      time_period: 'String',
      rider_remark: 'Nullable(String)',
      has_data_gap: 'UInt8',
      has_refund: 'UInt8',
      refund_reason: 'Nullable(String)',
      date_key: 'Date',
      hour_key: 'UInt8'
    },
    partitionBy: 'date_key',
    orderBy: '(merchant_id, create_time)'
  },
  merchant_ranking_mv: {
    name: 'merchant_ranking_mv',
    engine: 'AggregatingMergeTree',
    columns: {
      merchant_id: 'String',
      merchant_name: 'String',
      business_district: 'String',
      date_key: 'Date',
      order_count: 'SimpleAggregateFunction(count, UInt64)',
      avg_prep_time: 'SimpleAggregateFunction(avg, Float32)',
      avg_wait_time: 'SimpleAggregateFunction(avg, Float32)',
      timeout_count: 'SimpleAggregateFunction(count, UInt64)',
      refund_count: 'SimpleAggregateFunction(count, UInt64)',
      data_gap_count: 'SimpleAggregateFunction(count, UInt64)'
    },
    partitionBy: 'date_key',
    orderBy: '(merchant_id, date_key)',
    ttl: 'date_key + INTERVAL 30 DAY'
  },
  timeout_reason_agg: {
    name: 'timeout_reason_agg',
    engine: 'SummingMergeTree',
    columns: {
      timeout_reason: 'String',
      date_key: 'Date',
      count: 'UInt32'
    },
    partitionBy: 'date_key',
    orderBy: '(timeout_reason, date_key)'
  }
}

class ClickHouseClient {
  private config: ClickHouseConfig
  private data: Record<string, any[]> = {}
  private lastMaterialized: number = 0

  constructor(config: ClickHouseConfig) {
    this.config = config
    this.initializeTables()
  }

  private initializeTables() {
    Object.keys(TABLES).forEach(name => {
      this.data[name] = []
    })
  }

  async query<T = any>(sql: string): Promise<QueryResult<T>> {
    const startTime = Date.now()
    await new Promise(resolve => setTimeout(resolve, 30 + Math.random() * 80))

    const result = this.executeSQL(sql)
    const elapsed = (Date.now() - startTime) / 1000

    return {
      data: result as T[],
      meta: {
        rows: result.length,
        bytes: JSON.stringify(result).length,
        elapsed
      }
    }
  }

  private executeSQL(sql: string): any[] {
    const cleaned = sql.replace(/\s+/g, ' ').trim()

    const insertMatch = cleaned.match(/INSERT INTO (\w+)\s+VALUES?\s*(.+)?$/i)
    if (insertMatch) {
      const table = insertMatch[1].toLowerCase()
      const valuesMatch = insertMatch[2]?.match(/\(([^)]+)\)/g)
      if (valuesMatch && this.data[table]) {
        valuesMatch.forEach(v => {
          const values = v.slice(1, -1).split(',').map(s => s.trim())
          const columns = Object.keys(TABLES[table].columns)
          const row: any = {}
          columns.forEach((col, i) => {
            const val = values[i]?.replace(/'/g, '')
            row[col] = this.parseValue(val, TABLES[table].columns[col])
          })
          this.data[table].push(row)
        })
      }
      this.runETLIfNeeded()
      return []
    }

    if (cleaned.toUpperCase().includes('SYSTEM MATERIALIZE')) {
      this.materializeViews()
      return []
    }

    const selectMatch = cleaned.match(
      /SELECT\s+(.+?)\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+?))?(?:\s+GROUP\s+BY\s+(.+?))?(?:\s+ORDER\s+BY\s+(.+?))?(?:\s+LIMIT\s+(\d+))?$/i
    )

    if (selectMatch) {
      const [, selectExpr, fromTable, whereExpr, groupByExpr, orderByExpr, limitExpr] = selectMatch
      const table = fromTable.toLowerCase()

      if (!this.data[table]) {
        return []
      }

      let result = [...this.data[table]]

      if (whereExpr) {
        result = result.filter(row => this.evalWhere(row, whereExpr))
      }

      if (groupByExpr) {
        const groups = groupByExpr.split(',').map(g => g.trim())
        const grouped: Record<string, any[]> = {}
        result.forEach(row => {
          const key = groups.map(g => row[g]).join('|')
          if (!grouped[key]) grouped[key] = []
          grouped[key].push(row)
        })

        const selects = selectExpr.split(',').map(s => s.trim())
        result = Object.values(grouped).map(groupRows => {
          const item: any = {}
          groups.forEach(g => {
            item[g] = groupRows[0][g]
          })
          selects.forEach(expr => {
            const aggMatch = expr.match(/(count|avg|sum|min|max)\((.+?)\)(?:\s+AS\s+(\w+))?/i)
            if (aggMatch) {
              const [, func, field, alias] = aggMatch
              const aliasName = alias || `${func.toLowerCase()}_${field}`
              const values = groupRows.map(r => Number(r[field === '*' ? Object.keys(groupRows[0])[0] : field]) || 0)
              switch (func.toUpperCase()) {
                case 'COUNT':
                  item[aliasName] = groupRows.length
                  break
                case 'AVG':
                  item[aliasName] = values.length > 0
                    ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
                    : 0
                  break
                case 'SUM':
                  item[aliasName] = Math.round(values.reduce((a, b) => a + b, 0))
                  break
                case 'MIN':
                  item[aliasName] = Math.min(...values)
                  break
                case 'MAX':
                  item[aliasName] = Math.max(...values)
                  break
              }
            }
          })
          return item
        })
      }

      if (orderByExpr) {
        const orderMatch = orderByExpr.match(/(\w+)\s*(DESC|ASC)?/i)
        if (orderMatch) {
          const [, field, dir] = orderMatch
          const desc = (dir || 'DESC').toUpperCase() === 'DESC'
          result.sort((a, b) => {
            const av = a[field]
            const bv = b[field]
            const cmp = av > bv ? 1 : av < bv ? -1 : 0
            return desc ? -cmp : cmp
          })
        }
      }

      if (limitExpr) {
        result = result.slice(0, parseInt(limitExpr))
      }

      return result
    }

    return []
  }

  private parseValue(val: string, type: string): any {
    if (type.includes('Nullable') && (val === 'NULL' || val === undefined || val === '')) {
      return null
    }
    if (type.includes('UInt') || type.includes('Int')) {
      return parseInt(val) || 0
    }
    if (type.includes('Float')) {
      return parseFloat(val) || 0
    }
    if (type.includes('Date') && val) {
      const d = new Date(val)
      return isNaN(d.getTime()) ? val : d.toISOString()
    }
    return val
  }

  private evalWhere(row: any, expr: string): boolean {
    const conds = expr.split(/\s+AND\s+/i)
    return conds.every(cond => {
      const match = cond.match(/(\w+)\s*(=|!=|>|<|>=|<=|IN)\s*(.+)/i)
      if (!match) return true

      const [, field, op, valueRaw] = match
      let value = valueRaw.trim().replace(/'/g, '')

      if (op === 'IN') {
        const inVals = value.replace(/[()]/g, '').split(',').map(v => v.trim().replace(/'/g, ''))
        return inVals.includes(String(row[field]))
      }

      if (value === '1') value = 1
      if (value === '0') value = 0

      const rowVal = row[field]
      switch (op) {
        case '=': return rowVal == value
        case '!=': return rowVal != value
        case '>': return rowVal > value
        case '<': return rowVal < value
        case '>=': return rowVal >= value
        case '<=': return rowVal <= value
        default: return true
      }
    })
  }

  insert(table: string, row: any) {
    if (this.data[table]) {
      this.data[table].push(row)
    }
  }

  private runETLIfNeeded() {
    const rawCount = this.data['orders_raw'].length
    const cleanCount = this.data['orders_clean'].length

    if (rawCount > cleanCount) {
      this.runETL(cleanCount)
    }
  }

  private runETL(startIndex: number) {
    const merchants = this.getMerchants()
    const merchantMap: Record<string, Merchant> = {}
    merchants.forEach(m => { merchantMap[m.id] = m })

    for (let i = startIndex; i < this.data['orders_raw'].length; i++) {
      const raw = this.data['orders_raw'][i]
      const merchant = merchantMap[raw.merchant_id]

      const createTime = new Date(raw.create_time)
      const acceptTime = new Date(raw.accept_time)
      const prepStartTime = new Date(raw.prep_start_time)
      const riderArriveTime = raw.rider_arrive_time ? new Date(raw.rider_arrive_time) : null
      const pickupTime = new Date(raw.pickup_time)
      const refundTime = raw.refund_time ? new Date(raw.refund_time) : null

      const prepDuration = Math.max(0, Math.round((prepStartTime.getTime() - acceptTime.getTime()) / 60000))
      const waitDuration = riderArriveTime
        ? Math.max(0, Math.round((pickupTime.getTime() - riderArriveTime.getTime()) / 60000))
        : null
      const refundDuration = refundTime
        ? Math.max(0, Math.round((refundTime.getTime() - createTime.getTime()) / 60000))
        : null
      const acceptDuration = Math.max(0, Math.round((acceptTime.getTime() - createTime.getTime()) / 60000))
      const totalDuration = prepDuration + (waitDuration || 0)

      const hasDataGap = riderArriveTime ? 0 : 1
      const isTimeout = prepDuration > THRESHOLDS.PREP_TIMEOUT ||
        (waitDuration !== null && waitDuration > THRESHOLDS.WAIT_TIMEOUT) ? 1 : 0

      const cleanRow = {
        order_id: raw.order_id,
        merchant_id: raw.merchant_id,
        merchant_name: merchant?.name || '',
        business_district: merchant?.businessDistrict || '',
        order_no: raw.order_no,
        create_time: createTime.toISOString(),
        accept_time: acceptTime.toISOString(),
        prep_start_time: prepStartTime.toISOString(),
        rider_arrive_time: riderArriveTime ? riderArriveTime.toISOString() : null,
        pickup_time: pickupTime.toISOString(),
        deliver_time: raw.deliver_time ? new Date(raw.deliver_time).toISOString() : null,
        refund_time: refundTime ? refundTime.toISOString() : null,
        prep_duration: prepDuration,
        wait_duration: waitDuration,
        refund_duration: refundDuration,
        accept_duration: acceptDuration,
        total_duration: totalDuration,
        is_timeout: isTimeout,
        timeout_reason: isTimeout ? raw.timeout_reason || null : null,
        weather: raw.weather,
        weather_category: WEATHER_CATEGORY_MAP[raw.weather] || 'favorable',
        time_period: raw.time_period,
        rider_remark: raw.rider_remark || null,
        has_data_gap: hasDataGap,
        has_refund: raw.has_refund,
        refund_reason: raw.refund_reason || null,
        date_key: createTime.toISOString().split('T')[0],
        hour_key: createTime.getHours()
      }

      this.data['orders_clean'].push(cleanRow)
    }
  }

  materializeViews() {
    const now = Date.now()
    if (now - this.lastMaterialized < 30000) {
      return
    }
    this.lastMaterialized = now

    this.data['merchant_ranking_mv'] = []
    const merchantGroups: Record<string, any[]> = {}

    this.data['orders_clean'].forEach(row => {
      const key = `${row.merchant_id}|${row.date_key}`
      if (!merchantGroups[key]) merchantGroups[key] = []
      merchantGroups[key].push(row)
    })

    Object.entries(merchantGroups).forEach(([key, rows]) => {
      const [merchantId, dateKey] = key.split('|')
      const sampleRow = rows[0]
      const prepRows = rows.filter(r => r.prep_duration > 0)
      const waitRows = rows.filter(r => r.wait_duration !== null && r.has_data_gap === 0)

      this.data['merchant_ranking_mv'].push({
        merchant_id: merchantId,
        merchant_name: sampleRow.merchant_name,
        business_district: sampleRow.business_district,
        date_key: dateKey,
        order_count: rows.length,
        avg_prep_time: prepRows.length > 0
          ? prepRows.reduce((s, r) => s + r.prep_duration, 0) / prepRows.length
          : 0,
        avg_wait_time: waitRows.length > 0
          ? waitRows.reduce((s, r) => s + (r.wait_duration || 0), 0) / waitRows.length
          : 0,
        timeout_count: rows.filter(r => r.is_timeout === 1).length,
        refund_count: rows.filter(r => r.has_refund === 1).length,
        data_gap_count: rows.filter(r => r.has_data_gap === 1).length
      })
    })

    this.data['timeout_reason_agg'] = []
    const reasonGroups: Record<string, number> = {}
    this.data['orders_clean']
      .filter(r => r.is_timeout === 1 && r.timeout_reason)
      .forEach(r => {
        const key = `${r.timeout_reason}|${r.date_key}`
        reasonGroups[key] = (reasonGroups[key] || 0) + 1
      })

    Object.entries(reasonGroups).forEach(([key, count]) => {
      const [reason, dateKey] = key.split('|')
      this.data['timeout_reason_agg'].push({
        timeout_reason: reason,
        date_key: dateKey,
        count
      })
    })
  }

  private getMerchants(): Merchant[] {
    const cached = localStorage.getItem('ch_merchants_list')
    if (cached) {
      try { return JSON.parse(cached) } catch { /* ignore */ }
    }
    const merchants = generateMockMerchants()
    localStorage.setItem('ch_merchants_list', JSON.stringify(merchants))
    return merchants
  }

  getTableData(table: string): any[] {
    return this.data[table] || []
  }
}

let chClient: ClickHouseClient | null = null

function getClient(): ClickHouseClient {
  if (!chClient) {
    const cached = localStorage.getItem(CH_CACHE_KEY)
    chClient = new ClickHouseClient({
      host: 'localhost',
      port: 8123,
      database: 'food_delivery',
      username: 'default'
    })

    if (cached) {
      try {
        const data = JSON.parse(cached)
        if (Date.now() - data.timestamp < CACHE_EXPIRE_MS) {
          Object.keys(data.tables).forEach(table => {
            (chClient as any).data[table] = data.tables[table]
          })
          return chClient
        }
      } catch { /* ignore */ }
    }

    initializeData(chClient)
  }
  return chClient
}

function initializeData(client: ClickHouseClient) {
  const merchants = generateMockMerchants()

  merchants.forEach(m => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let day = -59; day <= 0; day++) {
      const orderDate = new Date(today)
      orderDate.setDate(orderDate.getDate() + day)

      const ordersPerDay = 3 + Math.floor(Math.random() * 6)
      for (let o = 0; o < ordersPerDay; o++) {
        const orderHour = 10 + Math.floor(Math.random() * 12)
        const orderMin = Math.floor(Math.random() * 60)
        const createTime = new Date(orderDate)
        createTime.setHours(orderHour, orderMin, 0, 0)

        const acceptTime = new Date(createTime.getTime() + 30000 + Math.random() * 3 * 60000)
        const prepStartTime = new Date(acceptTime.getTime() + 2 * 60000 + Math.random() * 20 * 60000)

        const hasRiderArrive = Math.random() > 0.12
        const riderArriveTime = hasRiderArrive
          ? new Date(prepStartTime.getTime() + 2 * 60000 + Math.random() * 12 * 60000)
          : null

        const pickupTime = new Date(
          (riderArriveTime || prepStartTime).getTime() + 1 * 60000 + Math.random() * 12 * 60000
        )
        const deliverTime = new Date(pickupTime.getTime() + 15 * 60000 + Math.random() * 25 * 60000)

        const hasRefund = Math.random() < 0.06
        const refundTime = hasRefund
          ? new Date(createTime.getTime() + 10 * 60000 + Math.random() * 90 * 60000)
          : null

        const weathers = ['sunny', 'rainy', 'sunny', 'sunny', 'hot', 'rainy', 'foggy', 'windy', 'sunny', 'sunny']
        const periods = ['breakfast', 'lunch', 'lunch', 'lunch', 'afternoon', 'dinner', 'dinner', 'dinner', 'night', 'other']
        const timeoutReasons = ['商户备餐慢', '骑手到店晚', '订单爆单', '天气影响', '出餐口拥堵', '餐品制作复杂', '商户忘单']
        const refundReasons = ['出餐太慢取消', '餐品凉了', '送错餐', '等太久不要了']
        const riderRemarks = ['出餐口排队人多', '商户还没开始做', '爆单了需要等', undefined, undefined, undefined]

        const weather = weathers[Math.floor(Math.random() * weathers.length)]
        const timePeriod = periods[Math.floor(Math.random() * periods.length)]

        client.insert('orders_raw', {
          order_id: `order_${m.id}_${day}_${o}`,
          merchant_id: m.id,
          order_no: `DD${String(orderDate.getFullYear()).slice(-2)}${String(orderDate.getMonth() + 1).padStart(2, '0')}${String(orderDate.getDate()).padStart(2, '0')}${String(day * 100 + o).padStart(5, '0')}`,
          create_time: createTime.toISOString(),
          accept_time: acceptTime.toISOString(),
          prep_start_time: prepStartTime.toISOString(),
          rider_arrive_time: riderArriveTime ? riderArriveTime.toISOString() : null,
          pickup_time: pickupTime.toISOString(),
          deliver_time: deliverTime.toISOString(),
          refund_time: refundTime ? refundTime.toISOString() : null,
          weather,
          time_period: timePeriod,
          rider_remark: riderRemarks[Math.floor(Math.random() * riderRemarks.length)],
          has_refund: hasRefund ? 1 : 0,
          refund_reason: hasRefund ? refundReasons[Math.floor(Math.random() * refundReasons.length)] : null
        })
      }
    }
  })

  client.query(`SYSTEM MATERIALIZE VIEW merchant_ranking_mv`)
  cacheClientData(client)
}

function cacheClientData(client: ClickHouseClient) {
  try {
    const data = {
      timestamp: Date.now(),
      tables: (client as any).data
    }
    localStorage.setItem(CH_CACHE_KEY, JSON.stringify(data))
  } catch { /* ignore */ }
}

function buildWhereConditions(conditions: QueryConditions): string {
  const parts: string[] = []

  if (conditions.merchantId) {
    parts.push(`merchant_id = '${conditions.merchantId}'`)
  }
  if (conditions.startTime) {
    parts.push(`create_time >= '${conditions.startTime}'`)
  }
  if (conditions.endTime) {
    parts.push(`create_time <= '${conditions.endTime} 23:59:59'`)
  }
  if (conditions.weather && conditions.weather.length > 0) {
    parts.push(`weather IN (${conditions.weather.map(w => `'${w}'`).join(',')})`)
  }
  if (conditions.timePeriod && conditions.timePeriod.length > 0) {
    parts.push(`time_period IN (${conditions.timePeriod.map(w => `'${w}'`).join(',')})`)
  }
  if (conditions.hasDataGap !== undefined && conditions.hasDataGap !== null) {
    parts.push(`has_data_gap = ${conditions.hasDataGap ? 1 : 0}`)
  }
  if (conditions.isTimeout !== undefined && conditions.isTimeout !== null) {
    parts.push(`is_timeout = ${conditions.isTimeout ? 1 : 0}`)
  }
  if (conditions.hasRefund !== undefined && conditions.hasRefund !== null) {
    parts.push(`has_refund = ${conditions.hasRefund ? 1 : 0}`)
  }

  return parts.length > 0 ? ` WHERE ${parts.join(' AND ')}` : ''
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

function cleanRowToOrder(row: any): Order {
  return {
    id: row.order_id,
    merchantId: row.merchant_id,
    orderNo: row.order_no,
    createTime: row.create_time,
    acceptTime: row.accept_time,
    prepStartTime: row.prep_start_time,
    riderArriveTime: row.rider_arrive_time || undefined,
    pickupTime: row.pickup_time,
    deliverTime: row.deliver_time || undefined,
    refundTime: row.refund_time || undefined,
    prepDuration: row.prep_duration,
    waitDuration: row.wait_duration !== null ? row.wait_duration : undefined,
    refundDuration: row.refund_duration !== null ? row.refund_duration : undefined,
    isTimeout: row.is_timeout === 1,
    timeoutReason: row.timeout_reason || undefined,
    weather: row.weather,
    timePeriod: row.time_period,
    riderRemark: row.rider_remark || undefined,
    hasDataGap: row.has_data_gap === 1,
    hasRefund: row.has_refund === 1,
    refundReason: row.refund_reason || undefined
  }
}

function rowsToMetrics(rows: any[]): Metrics {
  const prepRows = rows.filter(r => r.prep_duration > 0)
  const waitRows = rows.filter(r => r.wait_duration !== null && r.has_data_gap === 0)
  const refundRows = rows.filter(r => r.refund_duration !== null && r.has_refund === 1)
  const acceptRows = rows.filter(r => r.accept_duration)

  const avgPrepTime = prepRows.length > 0
    ? Math.round(prepRows.reduce((s, r) => s + r.prep_duration, 0) / prepRows.length)
    : 0
  const avgWaitTime = waitRows.length > 0
    ? Math.round(waitRows.reduce((s, r) => s + (r.wait_duration || 0), 0) / waitRows.length)
    : 0
  const avgRefundTime = refundRows.length > 0
    ? Math.round(refundRows.reduce((s, r) => s + (r.refund_duration || 0), 0) / refundRows.length)
    : 0
  const avgAcceptTime = acceptRows.length > 0
    ? Math.round(acceptRows.reduce((s, r) => s + (r.accept_duration || 0), 0) / acceptRows.length)
    : 0
  const avgTotalTime = rows.length > 0
    ? Math.round(rows.reduce((s, r) => s + (r.total_duration || r.prep_duration + (r.wait_duration || 0)), 0) / rows.length)
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

function calculateMetricsForPeriodSync(merchantId: string, start: string, end: string): Metrics {
  const client = getClient()
  const data = (client as any).data['orders_clean'].filter((row: any) =>
    row.merchant_id === merchantId &&
    new Date(row.create_time) >= new Date(start) &&
    new Date(row.create_time) <= new Date(end + ' 23:59:59')
  )
  return rowsToMetrics(data)
}

export const ClickHouseService = {
  async query<T = any>(sql: string): Promise<QueryResult<T>> {
    const client = getClient()
    return client.query<T>(sql)
  },

  async queryOrders(conditions: QueryConditions = {}): Promise<Order[]> {
    const client = getClient()
    const where = buildWhereConditions(conditions)
    const sql = `SELECT * FROM orders_clean${where} ORDER BY create_time DESC LIMIT 500`
    const result = await client.query<any>(sql)
    return result.data.map(cleanRowToOrder)
  },

  async queryMerchants(conditions: QueryConditions = {}): Promise<Merchant[]> {
    const client = getClient()
    const merchants = generateMockMerchants()
    const dateCond = conditions.startTime && conditions.endTime
      ? ` WHERE date_key >= '${conditions.startTime}' AND date_key <= '${conditions.endTime}'`
      : ''

    const sql = `
      SELECT merchant_id, merchant_name, business_district,
             SUM(order_count) as total_orders,
             AVG(avg_prep_time) as avg_prep,
             AVG(avg_wait_time) as avg_wait,
             SUM(refund_count) as refund_count
      FROM merchant_ranking_mv
      ${dateCond}
      GROUP BY merchant_id, merchant_name, business_district
    `
    const result = await client.query<any>(sql)
    const rankingMap: Record<string, any> = {}
    result.data.forEach(r => { rankingMap[r.merchant_id] = r })

    return merchants.map(m => {
      const rank = rankingMap[m.id] || { total_orders: 0, avg_prep: 0, avg_wait: 0, refund_count: 0 }
      return {
        ...m,
        avgPrepTime: Math.round(rank.avg_prep || 0),
        avgWaitTime: Math.round(rank.avg_wait || 0),
        orderCount: rank.total_orders || 0,
        refundRate: rank.total_orders > 0 ? +(rank.refund_count / rank.total_orders * 100).toFixed(1) : 0,
        dataGapCount: 0
      }
    })
  },

  async queryMerchantMetrics(merchantId: string, conditions: QueryConditions = {}): Promise<Metrics> {
    const client = getClient()
    const where = buildWhereConditions({ ...conditions, merchantId })
    const sql = `SELECT * FROM orders_clean${where}`
    const result = await client.query<any>(sql)
    return rowsToMetrics(result.data)
  },

  async queryOverallMetrics(conditions: QueryConditions = {}): Promise<Metrics> {
    const client = getClient()
    const where = buildWhereConditions(conditions)
    const sql = `SELECT * FROM orders_clean${where}`
    const result = await client.query<any>(sql)
    return rowsToMetrics(result.data)
  },

  async queryDistrictHeat(conditions: QueryConditions = {}): Promise<DistrictHeatData[]> {
    const client = getClient()
    const where = buildWhereConditions(conditions)
    const sql = `
      SELECT business_district,
             AVG(prep_duration) as avg_prep,
             AVG(wait_duration) as avg_wait
      FROM orders_clean
      ${where}
      GROUP BY business_district
    `
    const result = await client.query<any>(sql)
    const merchants = generateMockMerchants()

    return result.data.map(r => {
      const sample = merchants.find(m => m.businessDistrict === r.business_district)
      return {
        name: r.business_district,
        value: Math.round((r.avg_prep || 0) + (r.avg_wait || 0)),
        center: sample ? [sample.longitude, sample.latitude] : [116.4, 39.9]
      }
    })
  },

  async queryTimeoutReasons(conditions: QueryConditions = {}): Promise<{ reason: string; count: number; percentage: number }[]> {
    const client = getClient()
    const where = buildWhereConditions({ ...conditions, isTimeout: true })
    const sql = `
      SELECT timeout_reason, COUNT(*) as cnt
      FROM orders_clean
      ${where}
      GROUP BY timeout_reason
      ORDER BY cnt DESC
    `
    const result = await client.query<any>(sql)
    const total = result.data.reduce((s, r) => s + r.cnt, 0)

    return result.data.map(r => ({
      reason: r.timeout_reason || '其他原因',
      count: r.cnt,
      percentage: total > 0 ? +(r.cnt / total * 100).toFixed(1) : 0
    }))
  },

  async queryOrderTimelineAvg(merchantId: string, conditions: QueryConditions = {}): Promise<{
    avgAcceptTime: number
    avgPrepStartTime: number
    avgRiderArriveTime: number
    avgPickupTime: number
  }> {
    const client = getClient()
    const where = buildWhereConditions({ ...conditions, merchantId, hasDataGap: false })
    const sql = `
      SELECT AVG(accept_duration) as avg_accept,
             AVG(accept_duration + prep_duration) as avg_prep_start,
             AVG(accept_duration + prep_duration + wait_duration) as avg_rider_pickup
      FROM orders_clean
      ${where}
    `
    const result = await client.query<any>(sql)
    const row = result.data[0] || { avg_accept: 1, avg_prep_start: 3, avg_rider_pickup: 10 }

    return {
      avgAcceptTime: Math.round(row.avg_accept || 1),
      avgPrepStartTime: Math.round(row.avg_prep_start || 3),
      avgRiderArriveTime: Math.round((row.avg_prep_start || 3) + 2),
      avgPickupTime: Math.round(row.avg_rider_pickup || 10)
    }
  },

  getRectifications(merchantId: string): Rectification[] {
    try {
      const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.RECTIFICATIONS) || '{}')
      const list: Rectification[] = all[merchantId] || []

      return list
        .map((r: Rectification) => ({
          ...r,
          beforeMetrics: calculateMetricsForPeriodSync(merchantId, r.beforePeriodStart, r.beforePeriodEnd),
          afterMetrics: calculateMetricsForPeriodSync(merchantId, r.afterPeriodStart, r.afterPeriodEnd)
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

  addRectification(merchantId: string, content: string, operator: string): Rectification {
    const now = new Date()
    const beforeStart = new Date(now)
    beforeStart.setDate(beforeStart.getDate() - 28)
    const beforeEnd = new Date(now)
    beforeEnd.setDate(beforeEnd.getDate() - 15)
    const afterStart = new Date(now)
    afterStart.setDate(afterStart.getDate() - 14)
    const afterEnd = new Date(now)

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
      beforeMetrics: calculateMetricsForPeriodSync(
        merchantId,
        beforeStart.toISOString(),
        beforeEnd.toISOString()
      ),
      afterMetrics: calculateMetricsForPeriodSync(
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
    const client = getClient()
    const sql = `SELECT * FROM orders_clean ORDER BY create_time DESC LIMIT 5000`
    const result = await client.query<any>(sql)
    return result.data.map(row => ({
      ...cleanRowToOrder(row),
      merchantName: row.merchant_name,
      businessDistrict: row.business_district
    }))
  },

  clearCache() {
    localStorage.removeItem(CH_CACHE_KEY)
    localStorage.removeItem('ch_merchants_list')
    chClient = null
  }
}
