import type { SupersetDataset, SupersetCacheEntry, SupersetPermission } from "@/types"
import { SUPERSET_CONFIG, CLICKHOUSE_CONFIG, POSTGRESQL_CONFIG } from "./config"
import { pgMeta } from "./postgresql"

const ROLE_PERMISSIONS: Record<string, SupersetPermission[]> = {
  operator: [
    { resource: "dashboard", actions: ["read"] },
    { resource: "csv", actions: ["export"] },
    { resource: "dataset", actions: ["read"] },
  ],
  warehouse_admin: [
    { resource: "dashboard", actions: ["read"] },
    { resource: "csv", actions: ["export"] },
    { resource: "dataset", actions: ["read"] },
    { resource: "warehouse_damage", actions: ["write"] },
    { resource: "quality_conclusion", actions: ["write"] },
  ],
  quality_supervisor: [
    { resource: "dashboard", actions: ["read"] },
    { resource: "csv", actions: ["export"] },
    { resource: "dataset", actions: ["read"] },
    { resource: "warehouse_damage", actions: ["write"] },
    { resource: "quality_conclusion", actions: ["write"] },
    { resource: "return_reason_mapping", actions: ["write"] },
    { resource: "low_sample_config", actions: ["write"] },
  ],
}

let currentRole: string = SUPERSET_CONFIG.defaultRole

export function setRole(role: string): void {
  currentRole = role
  console.log(`[Superset] Role switched to: ${role}`)
}

class SupersetClient {
  private datasets: Map<string, SupersetDataset> = new Map()
  private cache: Map<string, SupersetCacheEntry<unknown>> = new Map()
  private connectedDatabases: Map<number, { name: string; backend: string; status: string }> = new Map()

  constructor() {
    this.connectedDatabases.set(CLICKHOUSE_CONFIG.id, {
      name: CLICKHOUSE_CONFIG.name,
      backend: CLICKHOUSE_CONFIG.backend,
      status: "connected",
    })
    this.connectedDatabases.set(POSTGRESQL_CONFIG.id, {
      name: POSTGRESQL_CONFIG.name,
      backend: POSTGRESQL_CONFIG.backend,
      status: "connected",
    })

    console.log(`[Superset] Connected to ${CLICKHOUSE_CONFIG.name} (${CLICKHOUSE_CONFIG.host}:${CLICKHOUSE_CONFIG.port})`)
    console.log(`[Superset] Connected to ${POSTGRESQL_CONFIG.name} (${POSTGRESQL_CONFIG.host}:${POSTGRESQL_CONFIG.port})`)

    this.registerDataset({
      id: "ds-return-rate-trend",
      name: "return_rate_trend",
      schema: "analytics",
      tableName: "analytics.return_rate_trend",
      database: { id: CLICKHOUSE_CONFIG.id, name: CLICKHOUSE_CONFIG.name, backend: "clickhouse" },
      columns: [
        { name: "date", type: "Date", isFilterable: true },
        { name: "overseasRate", type: "Float64", isFilterable: false },
        { name: "domesticRate", type: "Float64", isFilterable: false },
        { name: "overallRate", type: "Float64", isFilterable: false },
      ],
    })
    this.registerDataset({
      id: "ds-sku-ranking",
      name: "sku_ranking",
      schema: "analytics",
      tableName: "analytics.sku_return_stats",
      database: { id: CLICKHOUSE_CONFIG.id, name: CLICKHOUSE_CONFIG.name, backend: "clickhouse" },
      columns: [
        { name: "sku", type: "String", isFilterable: true },
        { name: "totalOrders", type: "UInt64", isFilterable: false },
        { name: "returnCount", type: "UInt64", isFilterable: false },
        { name: "returnRate", type: "Float64", isFilterable: false },
      ],
    })
    this.registerDataset({
      id: "ds-logistics-correlation",
      name: "logistics_correlation",
      schema: "analytics",
      tableName: "analytics.logistics_node_stats",
      database: { id: CLICKHOUSE_CONFIG.id, name: CLICKHOUSE_CONFIG.name, backend: "clickhouse" },
      columns: [
        { name: "node", type: "String", isFilterable: true },
        { name: "avgDelayHours", type: "Float64", isFilterable: false },
        { name: "delayRate", type: "Float64", isFilterable: false },
        { name: "returnRate", type: "Float64", isFilterable: false },
      ],
    })
    this.registerDataset({
      id: "ds-quality-distribution",
      name: "quality_distribution",
      schema: "analytics",
      tableName: "analytics.quality_conclusion_stats",
      database: { id: CLICKHOUSE_CONFIG.id, name: CLICKHOUSE_CONFIG.name, backend: "clickhouse" },
      columns: [
        { name: "conclusion", type: "String", isFilterable: true },
        { name: "count", type: "UInt64", isFilterable: false },
        { name: "percentage", type: "Float64", isFilterable: false },
        { name: "totalRefundUSD", type: "Float64", isFilterable: false },
      ],
    })
    this.registerDataset({
      id: "ds-refund-report",
      name: "refund_report",
      schema: "analytics",
      tableName: "analytics.refund_by_currency",
      database: { id: CLICKHOUSE_CONFIG.id, name: CLICKHOUSE_CONFIG.name, backend: "clickhouse" },
      columns: [
        { name: "currency", type: "String", isFilterable: true },
        { name: "originalAmount", type: "Float64", isFilterable: false },
        { name: "convertedUSD", type: "Float64", isFilterable: false },
        { name: "exchangeRate", type: "Float64", isFilterable: false },
      ],
    })
    this.registerDataset({
      id: "ds-kpi-summary",
      name: "kpi_summary",
      schema: "analytics",
      tableName: "analytics.kpi_summary",
      database: { id: CLICKHOUSE_CONFIG.id, name: CLICKHOUSE_CONFIG.name, backend: "clickhouse" },
      columns: [
        { name: "totalReturnRate", type: "Float64", isFilterable: false },
        { name: "totalRefundUSD", type: "Float64", isFilterable: false },
        { name: "totalReturnOrders", type: "UInt64", isFilterable: false },
      ],
    })
    this.registerDataset({
      id: "ds-user-roles",
      name: "user_roles",
      schema: "public",
      tableName: "public.user_roles",
      database: { id: POSTGRESQL_CONFIG.id, name: POSTGRESQL_CONFIG.name, backend: "postgresql" },
      columns: [
        { name: "role", type: "varchar", isFilterable: true },
        { name: "permissions", type: "jsonb", isFilterable: false },
      ],
    })
    this.registerDataset({
      id: "ds-low-sample-config",
      name: "low_sample_config",
      schema: "public",
      tableName: "public.low_sample_config",
      database: { id: POSTGRESQL_CONFIG.id, name: POSTGRESQL_CONFIG.name, backend: "postgresql" },
      columns: [
        { name: "dimension", type: "varchar", isFilterable: true },
        { name: "threshold", type: "integer", isFilterable: false },
        { name: "enabled", type: "boolean", isFilterable: true },
      ],
    })
    this.registerDataset({
      id: "ds-currency-exchange",
      name: "currency_exchange",
      schema: "public",
      tableName: "public.currency_exchange",
      database: { id: POSTGRESQL_CONFIG.id, name: POSTGRESQL_CONFIG.name, backend: "postgresql" },
      columns: [
        { name: "currency", type: "varchar", isFilterable: true },
        { name: "exchangeRateToUSD", type: "decimal", isFilterable: false },
        { name: "effectiveDate", type: "date", isFilterable: true },
      ],
    })
  }

  registerDataset(dataset: SupersetDataset): void {
    this.datasets.set(dataset.name, dataset)
  }

  getDataset(name: string): SupersetDataset | undefined {
    return this.datasets.get(name)
  }

  listDatasets(): SupersetDataset[] {
    return Array.from(this.datasets.values())
  }

  listDatabases(): { id: number; name: string; backend: string; status: string }[] {
    return Array.from(this.connectedDatabases.entries()).map(([id, val]) => ({ id, ...val }))
  }

  query<T>(cacheKey: string, queryFn: () => T, ttlMs: number = SUPERSET_CONFIG.cacheTtlMs): T {
    const cached = this.cache.get(cacheKey) as SupersetCacheEntry<T> | undefined
    if (cached && Date.now() - cached.createdAt < cached.ttlMs) {
      console.log(`[Superset] Cache HIT: ${cacheKey}`)
      return cached.data
    }
    console.log(`[Superset] Cache MISS: ${cacheKey}, executing query...`)
    const data = queryFn()
    this.cache.set(cacheKey, { key: cacheKey, data, createdAt: Date.now(), ttlMs })
    return data
  }

  invalidateCache(key?: string): void {
    if (key) {
      this.cache.delete(key)
      console.log(`[Superset] Cache invalidated: ${key}`)
    } else {
      this.cache.clear()
      console.log(`[Superset] All cache invalidated`)
    }
  }

  checkPermission(resource: string, action: string): boolean {
    const permissions = ROLE_PERMISSIONS[currentRole]
    if (!permissions) return false
    const perm = permissions.find((p) => p.resource === resource)
    if (!perm) return false
    return perm.actions.includes(action)
  }

  exportCSV(filename: string, headers: string[], rows: string[][]): void {
    const canExport = this.checkPermission("csv", "export")
    if (!canExport) {
      console.error("[Superset] Permission denied: csv export")
      return
    }

    const bom = "\uFEFF"
    const headerLine = headers.join(",")
    const dataLines = rows.map((row) => row.join(",")).join("\n")
    const csvContent = bom + headerLine + "\n" + dataLines
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = filename.endsWith(".csv") ? filename : filename + ".csv"
    anchor.click()
    URL.revokeObjectURL(url)
    console.log(`[Superset] CSV exported: ${filename}`)
  }

  exportChartImage(filename: string, dataUrl: string): void {
    const anchor = document.createElement("a")
    anchor.href = dataUrl
    anchor.download = filename.endsWith(".png") ? filename : filename + ".png"
    anchor.click()
    console.log(`[Superset] Chart image exported: ${filename}`)
  }

  getExportDataWithRates(warehouseType: string): { currency: string; originalAmount: number; exchangeRate: number; convertedUSD: number }[] {
    const rates = pgMeta.getCurrencyExchangeRates()
    return rates.map((r) => ({
      currency: r.currency,
      originalAmount: +(Math.random() * 50000 + 5000).toFixed(2),
      exchangeRate: r.exchangeRateToUSD,
      convertedUSD: +(Math.random() * 50000 + 5000 * r.exchangeRateToUSD).toFixed(2),
    }))
  }
}

export const supersetClient = new SupersetClient()
