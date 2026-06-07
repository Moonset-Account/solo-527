import type { SupersetDataset, SupersetCacheEntry, SupersetPermission } from "@/types"
import { SUPERSET_CONFIG, CLICKHOUSE_CONFIG, POSTGRESQL_CONFIG } from "./config"
import { supersetApi } from "./client"
import { supersetHttp } from "./http"
import type { QuerySource } from "./http"

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
}

export function getCurrentRole(): string {
  return currentRole
}

export interface QueryMeta {
  source: QuerySource
  timestamp: string
}

class SupersetClient {
  private datasets: Map<string, SupersetDataset> = new Map()
  private cache: Map<string, SupersetCacheEntry<unknown>> = new Map()
  private queryMeta: Map<string, QueryMeta> = new Map()

  constructor() {
    const chDb = { id: CLICKHOUSE_CONFIG.id, name: CLICKHOUSE_CONFIG.name, backend: "clickhouse" as const }
    const pgDb = { id: POSTGRESQL_CONFIG.id, name: POSTGRESQL_CONFIG.name, backend: "postgresql" as const }

    this.registerDataset({ id: "ds-return-rate-trend", name: "return_rate_trend", schema: "analytics", tableName: "analytics.return_rate_trend", database: chDb, columns: [{ name: "date", type: "Date", isFilterable: true }, { name: "overseasRate", type: "Float64", isFilterable: false }, { name: "domesticRate", type: "Float64", isFilterable: false }, { name: "overallRate", type: "Float64", isFilterable: false }] })
    this.registerDataset({ id: "ds-sku-ranking", name: "sku_ranking", schema: "analytics", tableName: "analytics.sku_return_stats", database: chDb, columns: [{ name: "sku", type: "String", isFilterable: true }, { name: "totalOrders", type: "UInt64", isFilterable: false }, { name: "returnCount", type: "UInt64", isFilterable: false }, { name: "returnRate", type: "Float64", isFilterable: false }] })
    this.registerDataset({ id: "ds-logistics-correlation", name: "logistics_correlation", schema: "analytics", tableName: "analytics.logistics_node_stats", database: chDb, columns: [{ name: "node", type: "String", isFilterable: true }, { name: "avgDelayHours", type: "Float64", isFilterable: false }, { name: "delayRate", type: "Float64", isFilterable: false }, { name: "returnRate", type: "Float64", isFilterable: false }] })
    this.registerDataset({ id: "ds-quality-distribution", name: "quality_distribution", schema: "analytics", tableName: "analytics.quality_conclusion_stats", database: chDb, columns: [{ name: "conclusion", type: "String", isFilterable: true }, { name: "count", type: "UInt64", isFilterable: false }, { name: "percentage", type: "Float64", isFilterable: false }, { name: "totalRefundUSD", type: "Float64", isFilterable: false }] })
    this.registerDataset({ id: "ds-refund-report", name: "refund_report", schema: "analytics", tableName: "analytics.refund_by_currency", database: chDb, columns: [{ name: "currency", type: "String", isFilterable: true }, { name: "originalAmount", type: "Float64", isFilterable: false }, { name: "convertedUSD", type: "Float64", isFilterable: false }, { name: "exchangeRate", type: "Float64", isFilterable: false }] })
    this.registerDataset({ id: "ds-kpi-summary", name: "kpi_summary", schema: "analytics", tableName: "analytics.kpi_summary", database: chDb, columns: [{ name: "totalReturnRate", type: "Float64", isFilterable: false }, { name: "totalRefundUSD", type: "Float64", isFilterable: false }, { name: "totalReturnOrders", type: "UInt64", isFilterable: false }] })
    this.registerDataset({ id: "ds-user-roles", name: "user_roles", schema: "public", tableName: "public.user_roles", database: pgDb, columns: [{ name: "role", type: "varchar", isFilterable: true }, { name: "permissions", type: "jsonb", isFilterable: false }] })
    this.registerDataset({ id: "ds-low-sample-config", name: "low_sample_config", schema: "public", tableName: "public.low_sample_config", database: pgDb, columns: [{ name: "dimension", type: "varchar", isFilterable: true }, { name: "threshold", type: "integer", isFilterable: false }, { name: "enabled", type: "boolean", isFilterable: true }] })
    this.registerDataset({ id: "ds-currency-exchange", name: "currency_exchange", schema: "public", tableName: "public.currency_exchange", database: pgDb, columns: [{ name: "currency", type: "varchar", isFilterable: true }, { name: "exchangeRateToUSD", type: "decimal", isFilterable: false }, { name: "effectiveDate", type: "date", isFilterable: true }] })
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

  listDatabases(): { id: number; name: string; backend: string; status: string; host: string; port: number }[] {
    return [
      { id: CLICKHOUSE_CONFIG.id, name: CLICKHOUSE_CONFIG.name, backend: "clickhouse", status: supersetApi.getStatus().status, host: CLICKHOUSE_CONFIG.host, port: CLICKHOUSE_CONFIG.port },
      { id: POSTGRESQL_CONFIG.id, name: POSTGRESQL_CONFIG.name, backend: "postgresql", status: supersetApi.getStatus().status, host: POSTGRESQL_CONFIG.host, port: POSTGRESQL_CONFIG.port },
    ]
  }

  getQueryMeta(cacheKey: string): QueryMeta | undefined {
    return this.queryMeta.get(cacheKey)
  }

  query<T>(cacheKey: string, queryFn: () => T, ttlMs: number = SUPERSET_CONFIG.cacheTtlMs): T {
    const cached = this.cache.get(cacheKey) as SupersetCacheEntry<T> | undefined
    if (cached && Date.now() - cached.createdAt < cached.ttlMs) {
      return cached.data
    }

    const source: QuerySource = supersetApi.getStatus().status === "connected"
      ? { source: "superset_api", cached: false, latencyMs: 0 }
      : { source: "in_memory", cached: false, latencyMs: 0 }

    const data = queryFn()
    this.cache.set(cacheKey, { key: cacheKey, data, createdAt: Date.now(), ttlMs })
    this.queryMeta.set(cacheKey, { source, timestamp: new Date().toISOString() })
    return data
  }

  invalidateCache(key?: string): void {
    if (key) {
      this.cache.delete(key)
      this.queryMeta.delete(key)
    } else {
      this.cache.clear()
      this.queryMeta.clear()
    }
  }

  checkPermission(resource: string, action: string): boolean {
    const permissions = ROLE_PERMISSIONS[currentRole]
    if (!permissions) return false
    const perm = permissions.find((p) => p.resource === resource)
    if (!perm) return false
    return perm.actions.includes(action)
  }

  async exportCSV(filename: string, headers: string[], rows: string[][]): Promise<{ success: boolean; error?: string; source?: string }> {
    const canExport = this.checkPermission("csv", "export")
    if (!canExport) {
      return { success: false, error: `当前角色(${currentRole})没有 CSV 导出权限` }
    }

    if (supersetApi.getStatus().status === "connected") {
      try {
        const blob = await supersetHttp.exportDatasetCSV("refund_report", {})
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement("a")
        anchor.href = url
        anchor.download = filename.endsWith(".csv") ? filename : filename + ".csv"
        anchor.click()
        URL.revokeObjectURL(url)
        return { success: true, source: "superset_api" }
      } catch {
        return { success: false, error: "Superset 导出接口请求失败，请检查服务状态" }
      }
    }

    if (supersetApi.getStatus().status === "fallback") {
      const bom = "\uFEFF"
      const headerLine = headers.map(this.formatCSVField).join(",")
      const dataLines = rows.map((row) => row.map(this.formatCSVField).join(",")).join("\n")
      const csvContent = bom + headerLine + "\n" + dataLines
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = filename.endsWith(".csv") ? filename : filename + ".csv"
      anchor.click()
      URL.revokeObjectURL(url)
      return { success: true, source: "local_fallback" }
    }

    return { success: false, error: "数据服务不可用，无法导出" }
  }

  private formatCSVField(value: string): string {
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
      return '"' + value.replace(/"/g, '""') + '"'
    }
    return value
  }

  exportChartImage(filename: string, dataUrl: string): void {
    const anchor = document.createElement("a")
    anchor.href = dataUrl
    anchor.download = filename.endsWith(".png") ? filename : ".png"
    anchor.click()
  }
}

export const supersetClient = new SupersetClient()
