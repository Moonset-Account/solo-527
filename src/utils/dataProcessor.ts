import type { Order, Metrics, ReasonAggregation, TrendDataPoint } from '@/types'
import { THRESHOLDS, TIMEOUT_REASONS } from '@/constants'

export function diffMinutes(end: string, start: string): number {
  const endTime = new Date(end).getTime()
  const startTime = new Date(start).getTime()
  return Math.round((endTime - startTime) / 60000)
}

export function normalizeTimestamp(timestamp: string): string {
  const date = new Date(timestamp)
  return date.toISOString()
}

export function formatTime(timestamp: string): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

export function formatDate(timestamp: string): string {
  const date = new Date(timestamp)
  return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
}

export function formatDateTime(timestamp: string): string {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export interface OrderRaw {
  id: string
  merchantId: string
  orderNo: string
  createTime: string
  acceptTime?: string
  prepStartTime?: string
  riderArriveTime?: string
  pickupTime?: string
  deliverTime?: string
  weather: string
  timePeriod: string
  riderRemark?: string
  hasRefund: boolean
  refundReason?: string
}

export function cleanOrderData(raw: OrderRaw): Order {
  const result: Order = {
    id: raw.id,
    merchantId: raw.merchantId,
    orderNo: raw.orderNo,
    createTime: normalizeTimestamp(raw.createTime),
    acceptTime: raw.acceptTime ? normalizeTimestamp(raw.acceptTime) : '',
    prepStartTime: raw.prepStartTime ? normalizeTimestamp(raw.prepStartTime) : '',
    riderArriveTime: raw.riderArriveTime ? normalizeTimestamp(raw.riderArriveTime) : undefined,
    pickupTime: raw.pickupTime ? normalizeTimestamp(raw.pickupTime) : '',
    deliverTime: raw.deliverTime ? normalizeTimestamp(raw.deliverTime) : undefined,
    prepDuration: 0,
    waitDuration: undefined,
    isTimeout: false,
    timeoutReason: undefined,
    weather: raw.weather,
    timePeriod: raw.timePeriod,
    riderRemark: raw.riderRemark,
    hasDataGap: false,
    hasRefund: raw.hasRefund,
    refundReason: raw.refundReason
  }

  if (result.acceptTime && result.prepStartTime) {
    result.prepDuration = diffMinutes(result.prepStartTime, result.acceptTime)
  }

  if (result.riderArriveTime && result.pickupTime) {
    result.waitDuration = diffMinutes(result.pickupTime, result.riderArriveTime)
  } else {
    result.hasDataGap = true
  }

  result.isTimeout =
    result.prepDuration > THRESHOLDS.PREP_TIMEOUT ||
    (result.waitDuration !== undefined && result.waitDuration > THRESHOLDS.WAIT_TIMEOUT)

  if (result.isTimeout) {
    result.timeoutReason = TIMEOUT_REASONS[Math.floor(Math.random() * TIMEOUT_REASONS.length)]
  }

  return result
}

export function calculateMetrics(orders: Order[]): Metrics {
  const prepOrders = orders.filter(o => o.prepDuration !== undefined && o.prepDuration > 0)
  const waitOrders = orders.filter(o => o.waitDuration !== undefined && !o.hasDataGap)

  const avgPrepTime = prepOrders.length > 0
    ? Math.round(prepOrders.reduce((sum, o) => sum + o.prepDuration, 0) / prepOrders.length)
    : 0

  const avgWaitTime = waitOrders.length > 0
    ? Math.round(waitOrders.reduce((sum, o) => sum + (o.waitDuration || 0), 0) / waitOrders.length)
    : 0

  const timeoutCount = orders.filter(o => o.isTimeout).length
  const refundCount = orders.filter(o => o.hasRefund).length

  return {
    avgPrepTime,
    avgWaitTime,
    orderCount: orders.length,
    timeoutRate: orders.length > 0 ? +(timeoutCount / orders.length * 100).toFixed(1) : 0,
    refundRate: orders.length > 0 ? +(refundCount / orders.length * 100).toFixed(1) : 0
  }
}

export function aggregateTimeoutReasons(orders: Order[]): ReasonAggregation[] {
  const validOrders = orders.filter(o => o.isTimeout && o.timeoutReason)
  const groups: Record<string, number> = {}

  validOrders.forEach(o => {
    const reason = o.timeoutReason || '其他原因'
    groups[reason] = (groups[reason] || 0) + 1
  })

  const total = validOrders.length
  return Object.entries(groups)
    .map(([reason, count]) => ({
      reason,
      count,
      percentage: total > 0 ? +(count / total * 100).toFixed(1) : 0
    }))
    .sort((a, b) => b.count - a.count)
}

export function generateTrendData(orders: Order[], days: number = 7): TrendDataPoint[] {
  const result: TrendDataPoint[] = []
  const today = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]

    const dayOrders = orders.filter(o => o.createTime.split('T')[0] === dateStr)
    const metrics = calculateMetrics(dayOrders)

    result.push({
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      avgPrepTime: metrics.avgPrepTime,
      avgWaitTime: metrics.avgWaitTime,
      orderCount: metrics.orderCount
    })
  }

  return result
}

export function exportToCSV(orders: Order[], filename: string = 'orders.csv') {
  const headers = [
    '订单号',
    '商户ID',
    '创建时间',
    '接单时间',
    '备餐开始',
    '骑手到店',
    '取餐时间',
    '备餐时长(分钟)',
    '等待时长(分钟)',
    '是否超时',
    '超时原因',
    '天气',
    '时段',
    '骑手备注',
    '是否退款',
    '退款原因',
    '数据缺口'
  ]

  const rows = orders.map(o => [
    o.orderNo,
    o.merchantId,
    o.createTime,
    o.acceptTime,
    o.prepStartTime,
    o.riderArriveTime || '',
    o.pickupTime,
    o.prepDuration,
    o.waitDuration ?? '',
    o.isTimeout ? '是' : '否',
    o.timeoutReason || '',
    o.weather,
    o.timePeriod,
    o.riderRemark || '',
    o.hasRefund ? '是' : '否',
    o.refundReason || '',
    o.hasDataGap ? '是' : '否'
  ])

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n')

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}
