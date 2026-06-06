export interface Store {
  id: string
  name: string
  district: string
  area: number
  openDate: string
}

export interface Category {
  id: string
  name: string
  parentId?: string
}

export type WeatherType = 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'snowy' | 'hot' | 'cold'

export type TimeWindow = 'day' | 'week' | 'month'

export interface Campaign {
  id: string
  name: string
  startDate: string
  endDate: string
  type: string
  description: string
}

export interface HourlySalesData {
  hour: number
  weekday: number
  orderCount: number
  salesAmount: number
}

export interface DailySalesData {
  storeId: string
  storeName: string
  date: string
  salesAmount: number
  orderCount: number
  avgOrderValue: number
  couponUsage: number
  couponRedemption: number
  inventoryLoss: number
  inventoryLossRate: number
  weatherType: WeatherType
  temperature: number
  isHoliday: boolean
  holidayName?: string
  campaignId?: string
  hourlyData?: HourlySalesData[]
}

export interface KPIData {
  totalSales: number
  avgOrderValue: number
  totalOrders: number
  inventoryLossRate: number
  salesWoW: number
  aovWoW: number
  ordersWoW: number
  lossRateWoW: number
  sampleSize: number
  totalCouponUsage: number
  couponRedemptionRate: number
}

export interface TimeSeriesPoint {
  date: string
  salesAmount: number
  orderCount: number
  avgOrderValue: number
  inventoryLossRate: number
  isHoliday: boolean
  campaignId?: string
}

export interface StorePerformance {
  storeId: string
  storeName: string
  district: string
  totalSales: number
  avgOrderValue: number
  totalOrders: number
  inventoryLossRate: number
  salesWoW: number
  weatherImpactScore: number
  rank: number
}

export interface WeatherImpact {
  weatherType: WeatherType
  avgSales: number
  avgOrders: number
  avgAOV: number
  sampleSize: number
  salesIndex: number
}

export interface CampaignComparison {
  period: 'before' | 'during' | 'after'
  startDate: string
  endDate: string
  totalSales: number
  avgDailySales: number
  totalOrders: number
  avgOrderValue: number
  couponRedemptionRate: number
  salesLift: number
}

export interface AnomalyPoint {
  id: string
  type: 'low_sales' | 'high_loss' | 'weather_abnormal' | 'campaign_outlier'
  storeId: string
  storeName: string
  date: string
  value: number
  expected: number
  deviation: number
  severity: 'warning' | 'critical'
  description: string
}

export interface SavedView {
  id: string
  name: string
  filters: FilterState
  createdAt: number
  updatedAt: number
}

export interface FilterState {
  storeIds: string[]
  categories: string[]
  timeRange: { start: string; end: string }
  timeWindow: TimeWindow
  weatherTypes: WeatherType[]
  campaignId: string | null
  compareWithCampaign: boolean
}
