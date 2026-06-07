import type { SupersetDataset, SupersetCacheEntry, SupersetPermission } from '@/types'

const ROLE_PERMISSIONS: Record<string, SupersetPermission[]> = {
  operator: [
    { resource: 'dashboard', actions: ['read'] },
    { resource: 'csv', actions: ['export'] },
    { resource: 'dataset', actions: ['read'] },
  ],
  warehouse_admin: [
    { resource: 'dashboard', actions: ['read'] },
    { resource: 'csv', actions: ['export'] },
    { resource: 'dataset', actions: ['read'] },
    { resource: 'warehouse_damage', actions: ['write'] },
    { resource: 'quality_conclusion', actions: ['write'] },
  ],
  quality_supervisor: [
    { resource: 'dashboard', actions: ['read'] },
    { resource: 'csv', actions: ['export'] },
    { resource: 'dataset', actions: ['read'] },
    { resource: 'warehouse_damage', actions: ['write'] },
    { resource: 'quality_conclusion', actions: ['write'] },
    { resource: 'return_reason_mapping', actions: ['write'] },
    { resource: 'low_sample_config', actions: ['write'] },
  ],
}

let currentRole = 'operator'

export function setRole(role: string): void {
  currentRole = role
}

class SupersetClient {
  private datasets: Map<string, SupersetDataset> = new Map()
  private cache: Map<string, SupersetCacheEntry<unknown>> = new Map()

  constructor() {
    this.registerDataset({
      id: 'ds-return-rate-trend',
      name: 'return_rate_trend',
      schema: 'analytics',
      tableName: 'analytics.return_rate_trend',
      database: { id: 1, name: 'clickhouse-analytics', backend: 'clickhouse' },
      columns: [
        { name: 'date', type: 'Date', isFilterable: true },
        { name: 'overseasRate', type: 'Float64', isFilterable: false },
        { name: 'domesticRate', type: 'Float64', isFilterable: false },
        { name: 'overallRate', type: 'Float64', isFilterable: false },
      ],
    })
    this.registerDataset({
      id: 'ds-sku-ranking',
      name: 'sku_ranking',
      schema: 'analytics',
      tableName: 'analytics.sku_return_stats',
      database: { id: 1, name: 'clickhouse-analytics', backend: 'clickhouse' },
      columns: [
        { name: 'sku', type: 'String', isFilterable: true },
        { name: 'totalOrders', type: 'UInt64', isFilterable: false },
        { name: 'returnCount', type: 'UInt64', isFilterable: false },
        { name: 'returnRate', type: 'Float64', isFilterable: false },
      ],
    })
    this.registerDataset({
      id: 'ds-logistics-correlation',
      name: 'logistics_correlation',
      schema: 'analytics',
      tableName: 'analytics.logistics_node_stats',
      database: { id: 1, name: 'clickhouse-analytics', backend: 'clickhouse' },
      columns: [
        { name: 'node', type: 'String', isFilterable: true },
        { name: 'avgDelayHours', type: 'Float64', isFilterable: false },
        { name: 'delayRate', type: 'Float64', isFilterable: false },
        { name: 'returnRate', type: 'Float64', isFilterable: false },
      ],
    })
    this.registerDataset({
      id: 'ds-quality-distribution',
      name: 'quality_distribution',
      schema: 'analytics',
      tableName: 'analytics.quality_conclusion_stats',
      database: { id: 1, name: 'clickhouse-analytics', backend: 'clickhouse' },
      columns: [
        { name: 'conclusion', type: 'String', isFilterable: true },
        { name: 'count', type: 'UInt64', isFilterable: false },
        { name: 'percentage', type: 'Float64', isFilterable: false },
        { name: 'totalRefundUSD', type: 'Float64', isFilterable: false },
      ],
    })
    this.registerDataset({
      id: 'ds-refund-report',
      name: 'refund_report',
      schema: 'analytics',
      tableName: 'analytics.refund_by_currency',
      database: { id: 1, name: 'clickhouse-analytics', backend: 'clickhouse' },
      columns: [
        { name: 'currency', type: 'String', isFilterable: true },
        { name: 'originalAmount', type: 'Float64', isFilterable: false },
        { name: 'convertedUSD', type: 'Float64', isFilterable: false },
        { name: 'exchangeRate', type: 'Float64', isFilterable: false },
      ],
    })
    this.registerDataset({
      id: 'ds-kpi-summary',
      name: 'kpi_summary',
      schema: 'analytics',
      tableName: 'analytics.kpi_summary',
      database: { id: 1, name: 'clickhouse-analytics', backend: 'clickhouse' },
      columns: [
        { name: 'totalReturnRate', type: 'Float64', isFilterable: false },
        { name: 'totalRefundUSD', type: 'Float64', isFilterable: false },
        { name: 'totalReturnOrders', type: 'UInt64', isFilterable: false },
      ],
    })
    this.registerDataset({
      id: 'ds-user-roles',
      name: 'user_roles',
      schema: 'public',
      tableName: 'public.user_roles',
      database: { id: 2, name: 'postgresql-main', backend: 'postgresql' },
      columns: [
        { name: 'role', type: 'varchar', isFilterable: true },
        { name: 'permissions', type: 'jsonb', isFilterable: false },
      ],
    })
    this.registerDataset({
      id: 'ds-low-sample-config',
      name: 'low_sample_config',
      schema: 'public',
      tableName: 'public.low_sample_config',
      database: { id: 2, name: 'postgresql-main', backend: 'postgresql' },
      columns: [
        { name: 'dimension', type: 'varchar', isFilterable: true },
        { name: 'threshold', type: 'integer', isFilterable: false },
        { name: 'enabled', type: 'boolean', isFilterable: true },
      ],
    })
    this.registerDataset({
      id: 'ds-currency-exchange',
      name: 'currency_exchange',
      schema: 'public',
      tableName: 'public.currency_exchange',
      database: { id: 2, name: 'postgresql-main', backend: 'postgresql' },
      columns: [
        { name: 'currency', type: 'varchar', isFilterable: true },
        { name: 'exchangeRateToUSD', type: 'decimal', isFilterable: false },
        { name: 'effectiveDate', type: 'date', isFilterable: true },
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

  query<T>(cacheKey: string, queryFn: () => T, ttlMs: number = 60000): T {
    const cached = this.cache.get(cacheKey) as SupersetCacheEntry<T> | undefined
    if (cached && Date.now() - cached.createdAt < cached.ttlMs) {
      return cached.data
    }
    const data = queryFn()
    this.cache.set(cacheKey, { key: cacheKey, data, createdAt: Date.now(), ttlMs })
    return data
  }

  invalidateCache(key?: string): void {
    if (key) {
      this.cache.delete(key)
    } else {
      this.cache.clear()
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
    const bom = '\uFEFF'
    const headerLine = headers.join(',')
    const dataLines = rows.map((row) => row.join(',')).join('\n')
    const csvContent = bom + headerLine + '\n' + dataLines
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename.endsWith('.csv') ? filename : filename + '.csv'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  exportChartImage(filename: string, dataUrl: string): void {
    const anchor = document.createElement('a')
    anchor.href = dataUrl
    anchor.download = filename.endsWith('.png') ? filename : filename + '.png'
    anchor.click()
  }
}

export const supersetClient = new SupersetClient()
