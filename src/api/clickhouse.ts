import type {
  WarehouseType,
  ReturnRateTrend,
  KPIData,
  SKUReturnStats,
  LogisticsNodeStats,
  QualityConclusionStats,
  RefundByCurrency,
  OrderRecord,
} from "@/types"
import { chStore } from "./migrate"
import { CLICKHOUSE_CONFIG } from "./config"

export const CLICKHOUSE_DDL = `
CREATE DATABASE IF NOT EXISTS analytics;

CREATE TABLE IF NOT EXISTS analytics.return_rate_trend
(
  date Date,
  overseas_rate Float32,
  domestic_rate Float32,
  overall_rate Float32,
  warehouse_type LowCardinality(String)
)
ENGINE = MergeTree()
ORDER BY date;

CREATE TABLE IF NOT EXISTS analytics.kpi_summary
(
  id UInt32,
  total_return_rate Float32,
  total_refund_usd Float64,
  total_return_orders UInt32,
  avg_processing_days Float32,
  return_rate_trend Float32,
  refund_trend Float32,
  order_trend Float32,
  processing_trend Float32,
  warehouse_type LowCardinality(String),
  updated_at DateTime DEFAULT now()
)
ENGINE = MergeTree()
ORDER BY id;

CREATE TABLE IF NOT EXISTS analytics.sku_return_stats
(
  sku String,
  product_name String,
  total_orders UInt32,
  return_count UInt32,
  return_rate Float32,
  is_low_sample UInt8,
  top_return_reasons String,
  warehouse_type LowCardinality(String)
)
ENGINE = MergeTree()
ORDER BY (warehouse_type, return_rate);

CREATE TABLE IF NOT EXISTS analytics.logistics_node_stats
(
  node String,
  avg_delay_hours Float32,
  delay_rate Float32,
  return_rate Float32,
  order_count UInt32,
  is_low_sample UInt8,
  warehouse_type LowCardinality(String)
)
ENGINE = MergeTree()
ORDER BY (warehouse_type, node);

CREATE TABLE IF NOT EXISTS analytics.quality_conclusion_stats
(
  conclusion LowCardinality(String),
  conclusion_label String,
  count UInt32,
  percentage Float32,
  total_refund_usd Float64,
  is_low_sample UInt8,
  warehouse_type LowCardinality(String),
  category LowCardinality(String)
)
ENGINE = MergeTree()
ORDER BY (warehouse_type, conclusion);

CREATE TABLE IF NOT EXISTS analytics.refund_by_currency
(
  currency LowCardinality(String),
  original_amount Float64,
  converted_usd Float64,
  exchange_rate Float64,
  warehouse_type LowCardinality(String)
)
ENGINE = MergeTree()
ORDER BY (warehouse_type, currency);
`

class ClickHouseQueryEngine {
  private getConnectionInfo() {
    return {
      host: CLICKHOUSE_CONFIG.host,
      port: CLICKHOUSE_CONFIG.port,
      database: CLICKHOUSE_CONFIG.database,
      status: "connected" as const,
    }
  }

  execute<T>(sql: string, params?: Record<string, unknown>): T {
    const conn = this.getConnectionInfo()
    console.log(`[ClickHouse] Executing query on ${conn.host}:${conn.port}/${conn.database}`, sql.slice(0, 80))

    const normalizedSql = sql.toLowerCase()

    if (normalizedSql.includes("return_rate_trend")) {
      const warehouseType = (params?.warehouseType as WarehouseType) ?? "all"
      return this.getReturnRateTrend(warehouseType) as T
    }
    if (normalizedSql.includes("kpi_summary")) {
      const warehouseType = (params?.warehouseType as WarehouseType) ?? "all"
      return this.getKPISummary(warehouseType) as T
    }
    if (normalizedSql.includes("sku_return_stats")) {
      const warehouseType = (params?.warehouseType as WarehouseType) ?? "all"
      const lowSampleThreshold = (params?.lowSampleThreshold as number) ?? 30
      return this.getSKURanking(warehouseType, lowSampleThreshold) as T
    }
    if (normalizedSql.includes("logistics_node_stats")) {
      const warehouseType = (params?.warehouseType as WarehouseType) ?? "all"
      const lowSampleThreshold = (params?.lowSampleThreshold as number) ?? 50
      return this.getLogisticsCorrelation(warehouseType, lowSampleThreshold) as T
    }
    if (normalizedSql.includes("quality_conclusion_stats")) {
      const warehouseType = (params?.warehouseType as WarehouseType) ?? "all"
      const lowSampleThreshold = (params?.lowSampleThreshold as number) ?? 20
      return this.getQualityDistribution(warehouseType, lowSampleThreshold) as T
    }
    if (normalizedSql.includes("refund_by_currency")) {
      const warehouseType = (params?.warehouseType as WarehouseType) ?? "all"
      return this.getRefundReport(warehouseType) as T
    }

    throw new Error(`Unknown table in SQL: ${sql}`)
  }

  getReturnRateTrend(warehouseType: WarehouseType): ReturnRateTrend[] {
    const rows = chStore.returnRateTrend.select(
      (r) => r.warehouse_type === "all"
    )
    return rows.map((r) => {
      const base: ReturnRateTrend = {
        date: r.date as string,
        overseasRate: r.overseas_rate as number,
        domesticRate: r.domestic_rate as number,
        overallRate: r.overall_rate as number,
      }
      if (warehouseType === "overseas") {
        return { ...base, domesticRate: 0, overallRate: base.overseasRate }
      }
      if (warehouseType === "domestic") {
        return { ...base, overseasRate: 0, overallRate: base.domesticRate }
      }
      return base
    })
  }

  getKPISummary(warehouseType: WarehouseType): KPIData {
    const row = chStore.kpiSummary.select(
      (r) => r.warehouse_type === warehouseType
    )[0]
    if (!row) {
      const allRow = chStore.kpiSummary.select(
        (r) => r.warehouse_type === "all"
      )[0]
      return this.mapKPIRow(allRow)
    }
    return this.mapKPIRow(row)
  }

  private mapKPIRow(r: Record<string, unknown>): KPIData {
    return {
      totalReturnRate: r.total_return_rate as number,
      totalRefundUSD: r.total_refund_usd as number,
      totalReturnOrders: r.total_return_orders as number,
      avgProcessingDays: r.avg_processing_days as number,
      returnRateTrend: r.return_rate_trend as number,
      refundTrend: r.refund_trend as number,
      orderTrend: r.order_trend as number,
      processingTrend: r.processing_trend as number,
    }
  }

  getSKURanking(warehouseType: WarehouseType, lowSampleThreshold: number): SKUReturnStats[] {
    const rows = chStore.skuReturnStats.select(
      (r) => r.warehouse_type === warehouseType
    )
    return rows.map((r) => ({
      sku: r.sku as string,
      productName: r.product_name as string,
      totalOrders: r.total_orders as number,
      returnCount: r.return_count as number,
      returnRate: r.return_rate as number,
      isLowSample: (r.total_orders as number) < lowSampleThreshold,
      topReturnReasons: JSON.parse(r.top_return_reasons as string),
    }))
  }

  getSKUDetail(sku: string) {
    const row = chStore.skuReturnStats.select(
      (r) => r.sku === sku && r.warehouse_type === "all"
    )[0]
    if (!row) {
      return {
        sku,
        productName: "未知",
        totalOrders: 0,
        returnCount: 0,
        returnRate: 0,
        isLowSample: false,
        topReturnReasons: [] as { reason: string; count: number }[],
        logistics: [] as LogisticsNodeStats[],
        qualityConclusions: [] as QualityConclusionStats[],
        recentOrders: [] as OrderRecord[],
      }
    }

    const topReturnReasons: { reason: string; count: number }[] = JSON.parse(row.top_return_reasons as string)
    const returnCount = row.return_count as number
    const rand = this.seededRandom(sku.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0))

    const logisticsRows = chStore.logisticsNodeStats.select((r) => r.warehouse_type === "all")
    const logistics: LogisticsNodeStats[] = logisticsRows
      .filter((r) => (r.order_count as number) > 0)
      .slice(0, 8)
      .map((r) => ({
        node: r.node as string,
        avgDelayHours: r.avg_delay_hours as number,
        delayRate: r.delay_rate as number,
        returnRate: r.return_rate as number,
        orderCount: r.order_count as number,
        isLowSample: (r.order_count as number) < 50,
      }))

    const qualityRows = chStore.qualityConclusionStats.select((r) => r.warehouse_type === "all")
    const qualityConclusions: QualityConclusionStats[] = qualityRows.map((r) => ({
      conclusion: r.conclusion as string,
      conclusionLabel: r.conclusion_label as string,
      count: Math.max(1, Math.round(returnCount * ((r.percentage as number) / 100))),
      percentage: r.percentage as number,
      totalRefundUSD: +(returnCount * ((r.percentage as number) / 100) * (10 + rand() * 30)).toFixed(2),
      isLowSample: (r.count as number) < 20,
    }))

    const reasons = ["商品破损", "与描述不符", "质量问题", "尺码不合适", "颜色差异", "物流太慢"]
    const currencies = ["USD", "EUR", "GBP", "JPY", "AUD"]
    const warehouseNames = ["洛杉矶海外仓", "东京海外仓", "伦敦海外仓", "深圳国内仓", "杭州国内仓"]
    const recentOrders: OrderRecord[] = Array.from({ length: 5 }, (_, i) => {
      const curInfo = currencies[Math.floor(rand() * currencies.length)]
      const rates: Record<string, number> = { USD: 1, EUR: 1.08, GBP: 1.27, JPY: 0.0064, AUD: 0.65 }
      const refundUSD = +(10 + rand() * 90).toFixed(2)
      const refundAmount = curInfo === "USD" ? refundUSD : +(refundUSD / rates[curInfo]).toFixed(2)
      const orderDate = new Date()
      orderDate.setDate(orderDate.getDate() - Math.floor(rand() * 30))
      const returnDate = new Date(orderDate)
      returnDate.setDate(returnDate.getDate() + Math.floor(3 + rand() * 10))
      return {
        orderId: `ORD-${Date.now()}-${i}`,
        sku,
        warehouseType: rand() > 0.4 ? "overseas" as const : "domestic" as const,
        warehouseName: warehouseNames[Math.floor(rand() * warehouseNames.length)],
        logisticsNode: logistics[i % logistics.length]?.node ?? "未知",
        logisticsDelayHours: +(rand() * 48).toFixed(1),
        returnReason: reasons[Math.floor(rand() * reasons.length)],
        qualityConclusion: (["warehouse_damage", "consumer_reason", "other"] as const)[Math.floor(rand() * 3)],
        refundAmount,
        refundCurrency: curInfo,
        refundAmountUSD: refundUSD,
        orderDate: orderDate.toISOString().slice(0, 10),
        returnDate: returnDate.toISOString().slice(0, 10),
      }
    })

    return {
      sku: row.sku as string,
      productName: row.product_name as string,
      totalOrders: row.total_orders as number,
      returnCount: row.return_count as number,
      returnRate: row.return_rate as number,
      isLowSample: (row.total_orders as number) < 30,
      topReturnReasons,
      logistics,
      qualityConclusions,
      recentOrders,
    }
  }

  private seededRandom(seed: number): () => number {
    let s = seed
    return () => {
      s = (s * 16807 + 0) % 2147483647
      return (s - 1) / 2147483646
    }
  }

  getLogisticsCorrelation(warehouseType: WarehouseType, lowSampleThreshold: number): LogisticsNodeStats[] {
    const rows = chStore.logisticsNodeStats.select(
      (r) => r.warehouse_type === warehouseType
    )
    return rows
      .filter((r) => (r.order_count as number) > 0)
      .map((r) => ({
        node: r.node as string,
        avgDelayHours: r.avg_delay_hours as number,
        delayRate: r.delay_rate as number,
        returnRate: r.return_rate as number,
        orderCount: r.order_count as number,
        isLowSample: (r.order_count as number) < lowSampleThreshold,
      }))
  }

  getQualityDistribution(warehouseType: WarehouseType, lowSampleThreshold: number): QualityConclusionStats[] {
    const rows = chStore.qualityConclusionStats.select(
      (r) => r.warehouse_type === warehouseType
    )
    return rows.map((r) => ({
      conclusion: r.conclusion as string,
      conclusionLabel: r.conclusion_label as string,
      count: r.count as number,
      percentage: r.percentage as number,
      totalRefundUSD: r.total_refund_usd as number,
      isLowSample: (r.count as number) < lowSampleThreshold,
    }))
  }

  getRefundReport(warehouseType: WarehouseType): RefundByCurrency[] {
    const rows = chStore.refundByCurrency.select(
      (r) => r.warehouse_type === warehouseType
    )
    return rows.map((r) => ({
      currency: r.currency as string,
      originalAmount: r.original_amount as number,
      convertedUSD: r.converted_usd as number,
      exchangeRate: r.exchange_rate as number,
    }))
  }
}

export const clickhouse = new ClickHouseQueryEngine()
