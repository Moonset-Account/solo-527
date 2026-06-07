export interface OrderRecord {
  orderId: string
  sku: string
  warehouseType: "overseas" | "domestic"
  warehouseName: string
  logisticsNode: string
  logisticsDelayHours: number
  returnReason: string
  qualityConclusion: "warehouse_damage" | "consumer_reason" | "other"
  refundAmount: number
  refundCurrency: string
  refundAmountUSD: number
  orderDate: string
  returnDate: string
}

export interface SKUReturnStats {
  sku: string
  productName: string
  totalOrders: number
  returnCount: number
  returnRate: number
  isLowSample: boolean
  topReturnReasons: { reason: string; count: number }[]
}

export interface LogisticsNodeStats {
  node: string
  avgDelayHours: number
  delayRate: number
  returnRate: number
  orderCount: number
  isLowSample: boolean
}

export interface QualityConclusionStats {
  conclusion: string
  conclusionLabel: string
  count: number
  percentage: number
  totalRefundUSD: number
  isLowSample: boolean
}

export interface RefundByCurrency {
  currency: string
  originalAmount: number
  convertedUSD: number
  exchangeRate: number
}

export interface ReturnRateTrend {
  date: string
  overseasRate: number
  domesticRate: number
  overallRate: number
}

export interface KPIData {
  totalReturnRate: number
  totalRefundUSD: number
  totalReturnOrders: number
  avgProcessingDays: number
  returnRateTrend: number
  refundTrend: number
  orderTrend: number
  processingTrend: number
}

export type WarehouseType = "all" | "overseas" | "domestic"

export interface SupersetDataset {
  id: string
  name: string
  schema: string
  tableName: string
  database: { id: number; name: string; backend: "clickhouse" | "postgresql" }
  columns: { name: string; type: string; isFilterable: boolean }[]
}

export interface SupersetCacheEntry<T> {
  key: string
  data: T
  createdAt: number
  ttlMs: number
}

export interface SupersetPermission {
  resource: string
  actions: string[]
}

export interface UserRole {
  name: string
  permissions: SupersetPermission[]
}

export interface LowSampleConfig {
  dimension: string
  threshold: number
  enabled: boolean
}

export interface CurrencyExchangeRate {
  currency: string
  exchangeRateToUSD: number
  effectiveDate: string
}
