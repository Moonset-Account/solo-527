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
}

export interface QualityConclusionStats {
  conclusion: string
  conclusionLabel: string
  count: number
  percentage: number
  totalRefundUSD: number
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
