import * as duckdb from '@duckdb/duckdb-wasm'
import duckdb_wasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url'
import duckdb_wasm_eh from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url'
import type {
  InboundRecord,
  OutboundRecord,
  InventoryAgeRecord,
  ReturnRecord,
  SafetyStockRecord,
  FilterState
} from '$lib/types'
import type { DataSource } from '$lib/utils/analytics'
import { dataDictionary } from '$lib/data/data-dictionary'

let db: duckdb.AsyncDuckDB | null = null
let conn: duckdb.AsyncDuckDBConnection | null = null
let ready = false

const MANUAL_BUNDLES: duckdb.DuckDBBundles = {
  mvp: {
    mainModule: duckdb_wasm,
    mainWorker: new URL(
      '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js',
      import.meta.url
    ).toString()
  },
  eh: {
    mainModule: duckdb_wasm_eh,
    mainWorker: new URL(
      '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js',
      import.meta.url
    ).toString()
  }
}

async function createDB(): Promise<duckdb.AsyncDuckDB> {
  const bundle = await duckdb.selectBundle(MANUAL_BUNDLES)
  const workerUrl: string = bundle.mainWorker ?? ''
  const worker = new Worker(workerUrl)
  const logger = new duckdb.ConsoleLogger()
  const instance = new duckdb.AsyncDuckDB(logger, worker)
  await instance.instantiate(bundle.mainModule, bundle.pthreadWorker)
  return instance
}

const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS inbound (
  sku_id VARCHAR NOT NULL,
  sku_name VARCHAR NOT NULL,
  batch_no VARCHAR NOT NULL,
  warehouse_position VARCHAR NOT NULL,
  supplier_id VARCHAR NOT NULL,
  supplier_name VARCHAR NOT NULL,
  inbound_date DATE NOT NULL,
  quantity INTEGER NOT NULL,
  unit_cost DOUBLE NOT NULL,
  expiry_date DATE
);

CREATE TABLE IF NOT EXISTS outbound (
  sku_id VARCHAR NOT NULL,
  batch_no VARCHAR NOT NULL,
  outbound_date DATE NOT NULL,
  quantity INTEGER NOT NULL,
  outbound_type VARCHAR NOT NULL
);

CREATE TABLE IF NOT EXISTS inventory_age (
  sku_id VARCHAR NOT NULL,
  batch_no VARCHAR NOT NULL,
  warehouse_position VARCHAR NOT NULL,
  current_quantity INTEGER NOT NULL,
  age_days INTEGER NOT NULL,
  age_bucket VARCHAR NOT NULL,
  expiry_date DATE,
  days_to_expiry INTEGER,
  is_near_expiry BOOLEAN
);

CREATE TABLE IF NOT EXISTS returns (
  sku_id VARCHAR NOT NULL,
  batch_no VARCHAR NOT NULL,
  return_date DATE NOT NULL,
  quantity INTEGER NOT NULL,
  return_reason VARCHAR NOT NULL
);

CREATE TABLE IF NOT EXISTS safety_stock (
  sku_id VARCHAR NOT NULL,
  warehouse_position VARCHAR NOT NULL,
  safety_stock_qty INTEGER NOT NULL,
  reorder_point INTEGER NOT NULL,
  lead_time_days INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_inbound_sku ON inbound(sku_id, batch_no);
CREATE INDEX IF NOT EXISTS idx_outbound_sku ON outbound(sku_id, batch_no);
CREATE INDEX IF NOT EXISTS idx_inventory_sku ON inventory_age(sku_id, batch_no);
CREATE INDEX IF NOT EXISTS idx_returns_sku ON returns(sku_id, batch_no);
CREATE INDEX IF NOT EXISTS idx_safety_sku ON safety_stock(sku_id);
`

function applyMissingValueStrategy(tableName: string, records: Record<string, unknown>[]): Record<string, unknown>[] {
  const entries = dataDictionary.filter((e) => e.table_name === tableName)
  return records.map((row) => {
    const fixed = { ...row }
    for (const entry of entries) {
      const key = entry.field_name
      const val = fixed[key]
      const isMissing = val === undefined || val === null || val === ''
      if (!isMissing) continue
      if (entry.missing_value_strategy === 'fill_default' && entry.default_value !== null) {
        fixed[key] = entry.field_type === 'number' ? Number(entry.default_value) : entry.default_value
      } else if (entry.missing_value_strategy === 'mark_anomaly') {
        fixed[key] = entry.field_type === 'number' ? -1 : '__MISSING__'
      }
    }
    return fixed
  })
}

export async function initDuckDB(): Promise<void> {
  if (db && conn && ready) return
  db = await createDB()
  conn = await db.connect()
  await conn.query(CREATE_TABLES_SQL)
  ready = true
}

export function isReady(): boolean {
  return ready
}

export async function query<T>(sql: string): Promise<T[]> {
  if (!conn) throw new Error('DuckDB 未初始化，请先调用 initDuckDB()')
  const result = await conn.query(sql)
  return result.toArray().map((row) => {
    const obj: Record<string, unknown> = {}
    for (const key of Object.keys(row)) {
      const val = row[key]
      if (val instanceof Date) {
        obj[key] = val.toISOString().slice(0, 10)
      } else if (typeof val === 'bigint') {
        obj[key] = Number(val)
      } else {
        obj[key] = val
      }
    }
    return obj as T
  })
}

function sqlInList(values: string[]): string {
  return values.map((s) => `'${s}'`).join(',')
}

function buildFilterWhereClause(
  filters: Partial<FilterState>,
  options?: {
    hasWarehouse?: boolean
    hasSupplier?: boolean
    hasAgeBucket?: boolean
    dateColumn?: string
  }
): string {
  const clauses: string[] = []
  if (filters.sku_ids?.length) {
    clauses.push(`sku_id IN (${sqlInList(filters.sku_ids)})`)
  }
  if (options?.hasWarehouse && filters.warehouse_positions?.length) {
    clauses.push(`warehouse_position IN (${sqlInList(filters.warehouse_positions)})`)
  }
  if (options?.hasSupplier && filters.supplier_ids?.length) {
    clauses.push(`supplier_id IN (${sqlInList(filters.supplier_ids)})`)
  }
  if (filters.batch_nos?.length) {
    clauses.push(`batch_no IN (${sqlInList(filters.batch_nos)})`)
  }
  if (options?.hasAgeBucket && filters.age_buckets?.length) {
    clauses.push(`age_bucket IN (${sqlInList(filters.age_buckets)})`)
  }
  if (options?.dateColumn && filters.date_range?.start) {
    clauses.push(`${options.dateColumn} >= '${filters.date_range.start}'`)
  }
  if (options?.dateColumn && filters.date_range?.end) {
    clauses.push(`${options.dateColumn} <= '${filters.date_range.end}'`)
  }
  return clauses.length ? 'WHERE ' + clauses.join(' AND ') : ''
}

function buildPermissionClause(
  accessibleWarehouses: string[],
  accessibleSuppliers: string[],
  accessibleSkuCategories: string[],
  options?: { hasWarehouse?: boolean; hasSupplier?: boolean }
): string {
  const clauses: string[] = []
  if (accessibleWarehouses.length > 0 && options?.hasWarehouse) {
    clauses.push(`warehouse_position IN (${sqlInList(accessibleWarehouses)})`)
  }
  if (accessibleSuppliers.length > 0 && options?.hasSupplier) {
    clauses.push(`supplier_id IN (${sqlInList(accessibleSuppliers)})`)
  }
  if (accessibleSkuCategories.length > 0) {
    clauses.push(`sku_id IN (${sqlInList(accessibleSkuCategories)})`)
  }
  return clauses.join(' AND ')
}

function combineWhere(filterWhere: string, permissionClause: string): string {
  if (!filterWhere && !permissionClause) return ''
  if (!filterWhere && permissionClause) return `WHERE ${permissionClause}`
  if (filterWhere && !permissionClause) return filterWhere
  return filterWhere + ' AND ' + permissionClause
}

export async function loadData(data: {
  inbound?: InboundRecord[]
  outbound?: OutboundRecord[]
  inventory_age?: InventoryAgeRecord[]
  returns?: ReturnRecord[]
  safety_stock?: SafetyStockRecord[]
}): Promise<void> {
  await initDuckDB()
  if (!conn) return

  if (data.inbound?.length) {
    const processed = applyMissingValueStrategy('inbound_records', data.inbound as unknown as Record<string, unknown>[])
    const values = processed
      .map(
        (r) =>
          `('${r.sku_id}','${r.sku_name}','${r.batch_no}','${r.warehouse_position}','${r.supplier_id}','${r.supplier_name}','${r.inbound_date}',${r.quantity},${r.unit_cost},${r.expiry_date ? `'${r.expiry_date}'` : 'NULL'})`
      )
      .join(',')
    await conn.query(`DELETE FROM inbound`)
    await conn.query(`INSERT INTO inbound VALUES ${values}`)
  }

  if (data.outbound?.length) {
    const processed = applyMissingValueStrategy('outbound_records', data.outbound as unknown as Record<string, unknown>[])
    const values = processed
      .map(
        (r) =>
          `('${r.sku_id}','${r.batch_no}','${r.outbound_date}',${r.quantity},'${r.outbound_type}')`
      )
      .join(',')
    await conn.query(`DELETE FROM outbound`)
    await conn.query(`INSERT INTO outbound VALUES ${values}`)
  }

  if (data.inventory_age?.length) {
    const processed = applyMissingValueStrategy('inventory_age_records', data.inventory_age as unknown as Record<string, unknown>[])
    const values = processed
      .map(
        (r) =>
          `('${r.sku_id}','${r.batch_no}','${r.warehouse_position}',${r.current_quantity},${r.age_days},'${r.age_bucket}',${r.expiry_date ? `'${r.expiry_date}'` : 'NULL'},${r.days_to_expiry ?? 'NULL'},${r.is_near_expiry})`
      )
      .join(',')
    await conn.query(`DELETE FROM inventory_age`)
    await conn.query(`INSERT INTO inventory_age VALUES ${values}`)
  }

  if (data.returns?.length) {
    const processed = applyMissingValueStrategy('return_records', data.returns as unknown as Record<string, unknown>[])
    const values = processed
      .map(
        (r) =>
          `('${r.sku_id}','${r.batch_no}','${r.return_date}',${r.quantity},'${r.return_reason}')`
      )
      .join(',')
    await conn.query(`DELETE FROM returns`)
    await conn.query(`INSERT INTO returns VALUES ${values}`)
  }

  if (data.safety_stock?.length) {
    const processed = applyMissingValueStrategy('safety_stock_records', data.safety_stock as unknown as Record<string, unknown>[])
    const values = processed
      .map(
        (r) =>
          `('${r.sku_id}','${r.warehouse_position}',${r.safety_stock_qty},${r.reorder_point},${r.lead_time_days})`
      )
      .join(',')
    await conn.query(`DELETE FROM safety_stock`)
    await conn.query(`INSERT INTO safety_stock VALUES ${values}`)
  }
}

export async function getFilterOptions(): Promise<{
  sku_ids: string[]
  warehouse_positions: string[]
  supplier_ids: string[]
  batch_nos: string[]
  age_buckets: string[]
}> {
  await initDuckDB()
  const [skus, positions, suppliers, batches, buckets] = await Promise.all([
    query<{ sku_id: string }>('SELECT DISTINCT sku_id FROM inbound ORDER BY sku_id'),
    query<{ warehouse_position: string }>('SELECT DISTINCT warehouse_position FROM inbound ORDER BY warehouse_position'),
    query<{ supplier_id: string }>('SELECT DISTINCT supplier_id FROM inbound ORDER BY supplier_id'),
    query<{ batch_no: string }>('SELECT DISTINCT batch_no FROM inbound ORDER BY batch_no'),
    query<{ age_bucket: string }>('SELECT DISTINCT age_bucket FROM inventory_age ORDER BY age_bucket')
  ])
  return {
    sku_ids: skus.map((r) => r.sku_id),
    warehouse_positions: positions.map((r) => r.warehouse_position),
    supplier_ids: suppliers.map((r) => r.supplier_id),
    batch_nos: batches.map((r) => r.batch_no),
    age_buckets: buckets.map((r) => r.age_bucket)
  }
}

export async function queryDataSourceFromDuckDB(
  filters: Partial<FilterState>,
  accessibleWarehouses: string[],
  accessibleSuppliers: string[],
  accessibleSkuCategories: string[],
  skuNames: Record<string, string>
): Promise<DataSource> {
  if (!ready || !conn) {
    return {
      inbound: [],
      outbound: [],
      inventoryAge: [],
      returns: [],
      safetyStock: [],
      skuNames
    }
  }

  const inFilterWhere = buildFilterWhereClause(filters, {
    hasWarehouse: true,
    hasSupplier: true,
    dateColumn: 'inbound_date'
  })
  const inPermClause = buildPermissionClause(accessibleWarehouses, accessibleSuppliers, accessibleSkuCategories, { hasWarehouse: true, hasSupplier: true })
  const inWhere = combineWhere(inFilterWhere, inPermClause)

  const outFilterWhere = buildFilterWhereClause(filters, { dateColumn: 'outbound_date' })
  const outPermClause = buildPermissionClause(accessibleWarehouses, accessibleSuppliers, accessibleSkuCategories)
  const outWhere = combineWhere(outFilterWhere, outPermClause)

  const invFilterWhere = buildFilterWhereClause(filters, { hasWarehouse: true, hasAgeBucket: true })
  const invPermClause = buildPermissionClause(accessibleWarehouses, accessibleSuppliers, accessibleSkuCategories, { hasWarehouse: true })
  const invWhere = combineWhere(invFilterWhere, invPermClause)

  const retFilterWhere = buildFilterWhereClause(filters, {})
  const retPermClause = buildPermissionClause(accessibleWarehouses, accessibleSuppliers, accessibleSkuCategories)
  const retWhere = combineWhere(retFilterWhere, retPermClause)

  const ssFilterWhere = buildFilterWhereClause(filters, { hasWarehouse: true })
  const ssPermClause = buildPermissionClause(accessibleWarehouses, accessibleSuppliers, accessibleSkuCategories, { hasWarehouse: true })
  const ssWhere = combineWhere(ssFilterWhere, ssPermClause)

  const [inbound, outbound, inventoryAge, returns, safetyStock] = await Promise.all([
    query<InboundRecord>(`SELECT * FROM inbound ${inWhere}`),
    query<OutboundRecord>(`SELECT * FROM outbound ${outWhere}`),
    query<InventoryAgeRecord>(`SELECT * FROM inventory_age ${invWhere}`),
    query<ReturnRecord>(`SELECT * FROM returns ${retWhere}`),
    query<SafetyStockRecord>(`SELECT * FROM safety_stock ${ssWhere}`)
  ])

  return { inbound, outbound, inventoryAge, returns, safetyStock, skuNames }
}

export function buildWhereClause(filters: Partial<FilterState>): string {
  const clauses: string[] = []
  if (filters.sku_ids?.length) {
    clauses.push(`sku_id IN (${filters.sku_ids.map((s) => `'${s}'`).join(',')})`)
  }
  if (filters.warehouse_positions?.length) {
    clauses.push(`warehouse_position IN (${filters.warehouse_positions.map((s) => `'${s}'`).join(',')})`)
  }
  if (filters.supplier_ids?.length) {
    clauses.push(`supplier_id IN (${filters.supplier_ids.map((s) => `'${s}'`).join(',')})`)
  }
  if (filters.batch_nos?.length) {
    clauses.push(`batch_no IN (${filters.batch_nos.map((s) => `'${s}'`).join(',')})`)
  }
  if (filters.age_buckets?.length) {
    clauses.push(`age_bucket IN (${filters.age_buckets.map((s) => `'${s}'`).join(',')})`)
  }
  if (filters.date_range?.start) {
    clauses.push(`inbound_date >= '${filters.date_range.start}'`)
  }
  if (filters.date_range?.end) {
    clauses.push(`inbound_date <= '${filters.date_range.end}'`)
  }
  return clauses.length ? 'WHERE ' + clauses.join(' AND ') : ''
}
