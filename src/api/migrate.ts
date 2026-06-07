import type {
  ReturnRateTrend,
  KPIData,
  SKUReturnStats,
  LogisticsNodeStats,
  QualityConclusionStats,
  RefundByCurrency,
  LowSampleConfig,
  CurrencyExchangeRate,
  SupersetPermission,
  UserRole,
  WarehouseType,
} from "@/types"
import { CLICKHOUSE_CONFIG, POSTGRESQL_CONFIG } from "./config"

type ClickHouseRow = Record<string, unknown>
type PostgresRow = Record<string, unknown>

class InMemoryTable<T extends Record<string, unknown>> {
  readonly tableName: string
  readonly schema: string
  private rows: T[] = []
  private createdAt = Date.now()

  constructor(schema: string, tableName: string) {
    this.schema = schema
    this.tableName = tableName
  }

  insert(row: T): void {
    this.rows.push(row)
  }

  insertMany(rows: T[]): void {
    this.rows.push(...rows)
  }

  select(predicate?: (row: T) => boolean): T[] {
    return predicate ? this.rows.filter(predicate) : [...this.rows]
  }

  count(): number {
    return this.rows.length
  }

  get meta() {
    return {
      schema: this.schema,
      tableName: this.tableName,
      rowCount: this.rows.length,
      createdAt: new Date(this.createdAt).toISOString(),
      database: "",
    }
  }
}

export class ClickHouseStore {
  returnRateTrend: InMemoryTable<ClickHouseRow>
  kpiSummary: InMemoryTable<ClickHouseRow>
  skuReturnStats: InMemoryTable<ClickHouseRow>
  logisticsNodeStats: InMemoryTable<ClickHouseRow>
  qualityConclusionStats: InMemoryTable<ClickHouseRow>
  refundByCurrency: InMemoryTable<ClickHouseRow>

  constructor() {
    const s = CLICKHOUSE_CONFIG.schema
    this.returnRateTrend = new InMemoryTable<ClickHouseRow>(s, "return_rate_trend")
    this.kpiSummary = new InMemoryTable<ClickHouseRow>(s, "kpi_summary")
    this.skuReturnStats = new InMemoryTable<ClickHouseRow>(s, "sku_return_stats")
    this.logisticsNodeStats = new InMemoryTable<ClickHouseRow>(s, "logistics_node_stats")
    this.qualityConclusionStats = new InMemoryTable<ClickHouseRow>(s, "quality_conclusion_stats")
    this.refundByCurrency = new InMemoryTable<ClickHouseRow>(s, "refund_by_currency")
  }

  listTables(): InMemoryTable<ClickHouseRow>[] {
    return [
      this.returnRateTrend,
      this.kpiSummary,
      this.skuReturnStats,
      this.logisticsNodeStats,
      this.qualityConclusionStats,
      this.refundByCurrency,
    ]
  }
}

export class PostgresStore {
  userRoles: InMemoryTable<PostgresRow>
  userPermissions: InMemoryTable<PostgresRow>
  lowSampleConfig: InMemoryTable<PostgresRow>
  currencyExchange: InMemoryTable<PostgresRow>

  constructor() {
    const s = POSTGRESQL_CONFIG.schema
    this.userRoles = new InMemoryTable<PostgresRow>(s, "user_roles")
    this.userPermissions = new InMemoryTable<PostgresRow>(s, "user_permissions")
    this.lowSampleConfig = new InMemoryTable<PostgresRow>(s, "low_sample_config")
    this.currencyExchange = new InMemoryTable<PostgresRow>(s, "currency_exchange")
  }

  listTables(): InMemoryTable<PostgresRow>[] {
    return [this.userRoles, this.userPermissions, this.lowSampleConfig, this.currencyExchange]
  }
}

export const chStore = new ClickHouseStore()
export const pgStore = new PostgresStore()

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

function seedReturnRateTrend(): void {
  const rand = seededRandom(42)
  const startDate = new Date("2025-01-01")
  const rows: ClickHouseRow[] = []

  for (let i = 0; i < 24; i++) {
    const date = new Date(startDate)
    date.setMonth(date.getMonth() + i)
    const overseasRate = +(3.5 + rand() * 4).toFixed(2)
    const domesticRate = +(2.0 + rand() * 3).toFixed(2)
    const overallRate = +((overseasRate + domesticRate) / 2).toFixed(2)
    rows.push({
      date: date.toISOString().slice(0, 10),
      overseas_rate: overseasRate,
      domestic_rate: domesticRate,
      overall_rate: overallRate,
      warehouse_type: "all",
    })
  }

  chStore.returnRateTrend.insertMany(rows)
}

function seedKPISummary(): void {
  const rand = seededRandom(100)
  const makeKPI = (wt: string): ClickHouseRow => ({
    id: wt === "all" ? 1 : wt === "overseas" ? 2 : 3,
    total_return_rate: +(4.2 + rand() * 2).toFixed(2),
    total_refund_usd: +(120000 + rand() * 80000).toFixed(2),
    total_return_orders: Math.floor(1500 + rand() * 500),
    avg_processing_days: +(2.5 + rand() * 3).toFixed(1),
    return_rate_trend: +(-1.2 + rand() * 3).toFixed(2),
    refund_trend: +(-0.8 + rand() * 2.5).toFixed(2),
    order_trend: +(-0.5 + rand() * 2).toFixed(2),
    processing_trend: +(-0.3 + rand() * 1).toFixed(2),
    warehouse_type: wt,
    updated_at: new Date().toISOString(),
  })
  chStore.kpiSummary.insert(makeKPI("all"))
  chStore.kpiSummary.insert(makeKPI("overseas"))
  chStore.kpiSummary.insert(makeKPI("domestic"))
}

function seedSKUReturnStats(): void {
  const rand = seededRandom(200)
  const products = [
    { sku: "SKU-001", name: "无线蓝牙耳机 Pro" },
    { sku: "SKU-002", name: "USB-C 快充数据线 1.5m" },
    { sku: "SKU-003", name: "手机钢化膜 高清防指纹" },
    { sku: "SKU-004", name: "硅胶手机壳 防摔气囊" },
    { sku: "SKU-005", name: "便携式充电宝 20000mAh" },
    { sku: "SKU-006", name: "蓝牙音箱 迷你防水" },
    { sku: "SKU-007", name: "智能手表替换表带" },
    { sku: "SKU-008", name: "Type-C 转接头套装" },
    { sku: "SKU-009", name: "车载手机支架 磁吸式" },
    { sku: "SKU-010", name: "运动臂包 防水大屏" },
    { sku: "SKU-011", name: "LED 台灯 护眼调光" },
    { sku: "SKU-012", name: "手机散热器 半导体" },
    { sku: "SKU-013", name: "数据线收纳器 硅胶" },
    { sku: "SKU-014", name: "无线充电板 15W" },
    { sku: "SKU-015", name: "3.5mm 耳机转接头" },
  ]
  const reasons = ["商品破损", "与描述不符", "尺寸不合", "功能异常", "不喜欢", "物流太慢", "配件缺失"]

  for (const wt of ["all", "overseas", "domestic"] as const) {
    for (const p of products) {
      const totalOrders = Math.floor(20 + rand() * 480)
      const returnRate = +(3 + rand() * 12).toFixed(1)
      const returnCount = Math.floor(totalOrders * (returnRate / 100))
      const isLowSample = totalOrders < 30 ? 1 : 0
      const topReasons = reasons
        .sort(() => rand() - 0.5)
        .slice(0, 3)
        .map((r) => ({ reason: r, count: Math.floor(1 + rand() * returnCount * 0.4) }))

      chStore.skuReturnStats.insert({
        sku: p.sku,
        product_name: p.name,
        total_orders: totalOrders,
        return_count: returnCount,
        return_rate: returnRate,
        is_low_sample: isLowSample,
        top_return_reasons: JSON.stringify(topReasons),
        warehouse_type: wt,
      })
    }
  }
}

function seedLogisticsNodeStats(): void {
  const rand = seededRandom(300)
  const nodes = [
    { name: "国内揽收", type: "domestic" },
    { name: "国内分拨", type: "domestic" },
    { name: "出口清关", type: "overseas" },
    { name: "国际干线运输", type: "overseas" },
    { name: "目的国清关", type: "overseas" },
    { name: "海外仓入库", type: "overseas" },
    { name: "尾程派送", type: "overseas" },
    { name: "退货揽收", type: "domestic" },
    { name: "退货质检", type: "domestic" },
    { name: "二次上架", type: "domestic" },
    { name: "海外退货点", type: "overseas" },
    { name: "跨境转运", type: "overseas" },
  ]

  for (const wt of ["all", "overseas", "domestic"] as const) {
    for (const n of nodes) {
      const isRelevant =
        wt === "all" || (wt === "overseas" && n.type === "overseas") || (wt === "domestic" && n.type === "domestic")
      const baseOrders = isRelevant ? 1 : 0
      const orderCount = Math.floor(baseOrders * (15 + rand() * 485))
      const avgDelayHours = +(5 + rand() * 72).toFixed(1)
      const delayRate = +(5 + rand() * 40).toFixed(1)
      const returnRate = orderCount > 0 ? +(3 + rand() * 15).toFixed(1) : 0
      const isLowSample = orderCount > 0 && orderCount < 50 ? 1 : 0

      chStore.logisticsNodeStats.insert({
        node: n.name,
        avg_delay_hours: avgDelayHours,
        delay_rate: delayRate,
        return_rate: returnRate,
        order_count: orderCount,
        is_low_sample: isLowSample,
        warehouse_type: wt,
      })
    }
  }
}

function seedQualityConclusionStats(): void {
  const rand = seededRandom(400)
  const conclusions = [
    { conclusion: "warehouse_damage", label: "仓库破损", category: "warehouse" },
    { conclusion: "transport_damage", label: "运输损坏", category: "warehouse" },
    { conclusion: "wrong_item", label: "发错货", category: "warehouse" },
    { conclusion: "consumer_dissatisfied", label: "不满意", category: "consumer" },
    { conclusion: "consumer_wrong_size", label: "尺码不符", category: "consumer" },
    { conclusion: "consumer_changed_mind", label: "改变主意", category: "consumer" },
    { conclusion: "quality_defect", label: "质量缺陷", category: "other" },
    { conclusion: "other", label: "其他", category: "other" },
  ]

  for (const wt of ["all", "overseas", "domestic"] as const) {
    let remaining = 100
    for (let i = 0; i < conclusions.length; i++) {
      const c = conclusions[i]
      const isLast = i === conclusions.length - 1
      const pct = isLast ? remaining : Math.max(2, Math.floor(remaining * (0.15 + rand() * 0.35)))
      remaining -= pct
      const totalCount = Math.floor(500 + rand() * 2000)
      const count = Math.floor(totalCount * (pct / 100))
      const refundUSD = +(count * (8 + rand() * 40)).toFixed(2)
      const isLowSample = count < 20 ? 1 : 0

      chStore.qualityConclusionStats.insert({
        conclusion: c.conclusion,
        conclusion_label: c.label,
        count: count,
        percentage: +pct.toFixed(1),
        total_refund_usd: refundUSD,
        is_low_sample: isLowSample,
        warehouse_type: wt,
        category: c.category,
      })
    }
  }
}

function seedRefundByCurrency(exchangeRates: CurrencyExchangeRate[]): void {
  const rand = seededRandom(500)
  const currencies = ["USD", "EUR", "GBP", "JPY", "AUD"]

  for (const wt of ["all", "overseas", "domestic"] as const) {
    for (const cur of currencies) {
      const rate = exchangeRates.find((r) => r.currency === cur)
      const originalAmount = +(5000 + rand() * 50000).toFixed(2)
      const exchangeRate = rate?.exchangeRateToUSD ?? 1.0
      const convertedUSD = +(originalAmount * exchangeRate).toFixed(2)

      chStore.refundByCurrency.insert({
        currency: cur,
        original_amount: originalAmount,
        converted_usd: convertedUSD,
        exchange_rate: exchangeRate,
        warehouse_type: wt,
      })
    }
  }
}

function seedUserRoles(): void {
  const today = new Date().toISOString()

  const operatorPerms: SupersetPermission[] = [
    { resource: "dashboard", actions: ["view_all"] },
    { resource: "csv", actions: ["export"] },
    { resource: "dataset", actions: ["read_all"] },
  ]
  const warehouseAdminPerms: SupersetPermission[] = [
    ...operatorPerms,
    { resource: "warehouse_damage", actions: ["mark"] },
    { resource: "quality_conclusion", actions: ["write"] },
  ]
  const qualitySupervisorPerms: SupersetPermission[] = [
    ...warehouseAdminPerms,
    { resource: "return_reason_mapping", actions: ["write"] },
    { resource: "low_sample_config", actions: ["write"] },
  ]

  pgStore.userRoles.insertMany([
    { id: 1, user_id: "u001", role_name: "运营人员", created_at: today },
    { id: 2, user_id: "u002", role_name: "仓配管理员", created_at: today },
    { id: 3, user_id: "u003", role_name: "质控主管", created_at: today },
  ])

  const permRows: PostgresRow[] = []
  let permId = 1
  const rolePerms: [string, SupersetPermission[]][] = [
    ["u001", operatorPerms],
    ["u002", warehouseAdminPerms],
    ["u003", qualitySupervisorPerms],
  ]
  for (const [userId, perms] of rolePerms) {
    for (const p of perms) {
      permRows.push({
        id: permId++,
        user_id: userId,
        resource: p.resource,
        actions: `{${p.actions.join(",")}}`,
        created_at: today,
      })
    }
  }
  pgStore.userPermissions.insertMany(permRows)
}

function seedLowSampleConfig(): void {
  const today = new Date().toISOString()
  pgStore.lowSampleConfig.insertMany([
    { id: 1, dimension: "sku", threshold: 30, enabled: true, updated_at: today },
    { id: 2, dimension: "logistics_node", threshold: 50, enabled: true, updated_at: today },
    { id: 3, dimension: "quality_conclusion", threshold: 20, enabled: true, updated_at: today },
  ])
}

function seedCurrencyExchange(): CurrencyExchangeRate[] {
  const today = new Date().toISOString().split("T")[0]
  const rates: CurrencyExchangeRate[] = [
    { currency: "USD", exchangeRateToUSD: 1.0, effectiveDate: today },
    { currency: "EUR", exchangeRateToUSD: 1.08, effectiveDate: today },
    { currency: "GBP", exchangeRateToUSD: 1.27, effectiveDate: today },
    { currency: "JPY", exchangeRateToUSD: 0.0064, effectiveDate: today },
    { currency: "AUD", exchangeRateToUSD: 0.65, effectiveDate: today },
  ]
  pgStore.currencyExchange.insertMany(
    rates.map((r, i) => ({
      id: i + 1,
      currency: r.currency,
      exchange_rate_to_usd: r.exchangeRateToUSD,
      effective_date: r.effectiveDate,
      created_at: new Date().toISOString(),
    }))
  )
  return rates
}

export interface MigrationResult {
  database: string
  tables: { tableName: string; rowCount: number; createdAt: string }[]
  durationMs: number
}

let migrated = false

export function runMigrations(): MigrationResult[] {
  if (migrated) {
    return [
      {
        database: CLICKHOUSE_CONFIG.name,
        tables: chStore.listTables().map((t) => ({
          tableName: `${t.meta.schema}.${t.meta.tableName}`,
          rowCount: t.meta.rowCount,
          createdAt: t.meta.createdAt,
        })),
        durationMs: 0,
      },
      {
        database: POSTGRESQL_CONFIG.name,
        tables: pgStore.listTables().map((t) => ({
          tableName: `${t.meta.schema}.${t.meta.tableName}`,
          rowCount: t.meta.rowCount,
          createdAt: t.meta.createdAt,
        })),
        durationMs: 0,
      },
    ]
  }

  const start = Date.now()

  seedReturnRateTrend()
  seedKPISummary()
  seedSKUReturnStats()
  seedLogisticsNodeStats()
  seedQualityConclusionStats()
  const exchangeRates = seedCurrencyExchange()
  seedRefundByCurrency(exchangeRates)

  seedUserRoles()
  seedLowSampleConfig()

  migrated = true

  const chDuration = Date.now() - start

  const results: MigrationResult[] = [
    {
      database: CLICKHOUSE_CONFIG.name,
      tables: chStore.listTables().map((t) => ({
        tableName: `${t.meta.schema}.${t.meta.tableName}`,
        rowCount: t.meta.rowCount,
        createdAt: t.meta.createdAt,
      })),
      durationMs: chDuration,
    },
    {
      database: POSTGRESQL_CONFIG.name,
      tables: pgStore.listTables().map((t) => ({
        tableName: `${t.meta.schema}.${t.meta.tableName}`,
        rowCount: t.meta.rowCount,
        createdAt: t.meta.createdAt,
      })),
      durationMs: 0,
    },
  ]

  console.log("[Migration] Database migrations completed:")
  for (const r of results) {
    console.log(`  [${r.database}]`)
    for (const t of r.tables) {
      console.log(`    ${t.tableName}: ${t.rowCount} rows`)
    }
  }

  return results
}
