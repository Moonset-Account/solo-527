import type {
  WarehouseType,
  ReturnRateTrend,
  KPIData,
  SKUReturnStats,
  LogisticsNodeStats,
  QualityConclusionStats,
  RefundByCurrency,
} from '@/types'
import {
  generateReturnRateTrend as baseGenerateReturnRateTrend,
  generateKPIData,
  generateSKURanking,
  generateSKUDetail,
  generateLogisticsCorrelation,
  generateQualityDistribution,
  generateRefundReport,
} from '@/mock/data'

function generateReturnRateTrend(warehouseType: WarehouseType): ReturnRateTrend[] {
  const base = baseGenerateReturnRateTrend()

  return base.map((item) => {
    if (warehouseType === 'overseas') {
      return {
        ...item,
        domesticRate: 0,
        overallRate: item.overseasRate,
      }
    }
    if (warehouseType === 'domestic') {
      return {
        ...item,
        overseasRate: 0,
        overallRate: item.domesticRate,
      }
    }
    return item
  })
}

export const CLICKHOUSE_DDL = `
CREATE DATABASE IF NOT EXISTS analytics;

CREATE TABLE IF NOT EXISTS analytics.return_rate_trend
(
  date Date,
  overseas_rate Float32,
  domestic_rate Float32,
  overall_rate Float32
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
  warehouse_type LowCardinality(String)
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
  execute<T>(sql: string, params?: Record<string, unknown>): T {
    const normalizedSql = sql.toLowerCase()

    if (normalizedSql.includes('return_rate_trend')) {
      const warehouseType = (params?.warehouseType as WarehouseType) ?? 'all'
      return this.getReturnRateTrend(warehouseType) as T
    }
    if (normalizedSql.includes('kpi_summary')) {
      const warehouseType = (params?.warehouseType as WarehouseType) ?? 'all'
      return this.getKPISummary(warehouseType) as T
    }
    if (normalizedSql.includes('sku_return_stats')) {
      const warehouseType = (params?.warehouseType as WarehouseType) ?? 'all'
      const lowSampleThreshold = (params?.lowSampleThreshold as number) ?? 30
      return this.getSKURanking(warehouseType, lowSampleThreshold) as T
    }
    if (normalizedSql.includes('logistics_node_stats')) {
      const warehouseType = (params?.warehouseType as WarehouseType) ?? 'all'
      const lowSampleThreshold = (params?.lowSampleThreshold as number) ?? 30
      return this.getLogisticsCorrelation(warehouseType, lowSampleThreshold) as T
    }
    if (normalizedSql.includes('quality_conclusion_stats')) {
      const warehouseType = (params?.warehouseType as WarehouseType) ?? 'all'
      const lowSampleThreshold = (params?.lowSampleThreshold as number) ?? 30
      return this.getQualityDistribution(warehouseType, lowSampleThreshold) as T
    }
    if (normalizedSql.includes('refund_by_currency')) {
      const warehouseType = (params?.warehouseType as WarehouseType) ?? 'all'
      return this.getRefundReport(warehouseType) as T
    }

    throw new Error(`Unknown table in SQL: ${sql}`)
  }

  getReturnRateTrend(warehouseType: WarehouseType): ReturnRateTrend[] {
    return generateReturnRateTrend(warehouseType)
  }

  getKPISummary(warehouseType: WarehouseType): KPIData {
    return generateKPIData(warehouseType)
  }

  getSKURanking(warehouseType: WarehouseType, lowSampleThreshold: number): SKUReturnStats[] {
    const data = generateSKURanking(warehouseType)
    return data.map((item) => ({
      ...item,
      isLowSample: item.totalOrders < lowSampleThreshold,
    }))
  }

  getSKUDetail(sku: string) {
    return generateSKUDetail(sku)
  }

  getLogisticsCorrelation(warehouseType: WarehouseType, lowSampleThreshold: number): LogisticsNodeStats[] {
    const data = generateLogisticsCorrelation(warehouseType)
    return data.map((item) => ({
      ...item,
      isLowSample: item.orderCount < lowSampleThreshold,
    }))
  }

  getQualityDistribution(warehouseType: WarehouseType, lowSampleThreshold: number): QualityConclusionStats[] {
    const data = generateQualityDistribution(warehouseType)
    return data.map((item) => ({
      ...item,
      isLowSample: item.count < lowSampleThreshold,
    }))
  }

  getRefundReport(warehouseType: WarehouseType): RefundByCurrency[] {
    return generateRefundReport(warehouseType)
  }
}

export const clickhouse = new ClickHouseQueryEngine()
