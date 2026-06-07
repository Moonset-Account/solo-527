export interface Merchant {
  id: string
  name: string
  address: string
  longitude: number
  latitude: number
  businessDistrict: string
  avgPrepTime: number
  avgWaitTime: number
  orderCount: number
  refundRate: number
  dataGapCount: number
}

export interface Order {
  id: string
  merchantId: string
  orderNo: string
  createTime: string
  acceptTime: string
  prepStartTime: string
  riderArriveTime?: string
  pickupTime: string
  deliverTime?: string
  prepDuration: number
  waitDuration?: number
  isTimeout: boolean
  timeoutReason?: string
  weather: string
  timePeriod: string
  riderRemark?: string
  hasDataGap: boolean
  hasRefund: boolean
  refundReason?: string
}

export interface OrderTimelineEvent {
  type: 'create' | 'accept' | 'prep' | 'rider' | 'pickup' | 'deliver' | 'refund'
  time: string
  label: string
}

export interface Rectification {
  id: string
  merchantId: string
  createTime: string
  content: string
  operator: string
  beforePeriodStart: string
  beforePeriodEnd: string
  afterPeriodStart: string
  afterPeriodEnd: string
  beforeMetrics?: Metrics
  afterMetrics?: Metrics
}

export interface Metrics {
  avgPrepTime: number
  avgWaitTime: number
  orderCount: number
  timeoutRate: number
  refundRate: number
}

export interface DistrictHeatData {
  name: string
  value: number
  center: [number, number]
}

export interface TimeRangeFilter {
  start: string
  end: string
}

export interface FilterOptions {
  timeRange: TimeRangeFilter
  weather: string[]
  timePeriod: string[]
  hasDataGap: boolean | null
}

export interface ReasonAggregation {
  reason: string
  count: number
  percentage: number
}

export interface TrendDataPoint {
  date: string
  avgPrepTime: number
  avgWaitTime: number
  orderCount: number
}
