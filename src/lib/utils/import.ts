import Papa, { type ParseResult } from 'papaparse'
import type { ImportResult } from '$lib/types'
import { dataDictionary } from '$lib/data/data-dictionary'

const TABLE_HEADER_MAP: Record<string, string[]> = {
  inbound_records: [
    'sku_id', 'sku_name', 'batch_no', 'warehouse_position',
    'supplier_id', 'supplier_name', 'inbound_date', 'quantity',
    'unit_cost', 'expiry_date'
  ],
  outbound_records: [
    'sku_id', 'batch_no', 'outbound_date', 'quantity', 'outbound_type'
  ],
  inventory_age_records: [
    'sku_id', 'batch_no', 'warehouse_position', 'current_quantity',
    'age_days', 'age_bucket', 'expiry_date', 'days_to_expiry', 'is_near_expiry'
  ],
  return_records: [
    'sku_id', 'batch_no', 'return_date', 'quantity', 'return_reason'
  ],
  safety_stock_records: [
    'sku_id', 'warehouse_position', 'safety_stock_qty',
    'reorder_point', 'lead_time_days'
  ]
}

export async function parseCSV(file: File): Promise<ImportResult> {
  return new Promise<ImportResult>((resolve) => {
    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: ParseResult<Record<string, unknown>>) => {
        const headers = results.meta.fields || []
        const tableName = assignToTable(results.data, headers)
        if (!tableName) {
          resolve({
            table_name: '',
            total_rows: results.data.length,
            success_rows: 0,
            error_rows: results.data.length,
            errors: [{ row: 0, field: '', message: '无法识别数据表类型，请检查列头' }]
          })
          return
        }
        const validated = validateImportData(tableName, results.data)
        resolve(validated)
      },
      error: (err: Error) => {
        resolve({
          table_name: '',
          total_rows: 0,
          success_rows: 0,
          error_rows: 0,
          errors: [{ row: 0, field: '', message: `CSV解析失败: ${err.message}` }]
        })
      }
    })
  })
}

export function validateImportData(
  tableName: string,
  data: Record<string, unknown>[]
): ImportResult {
  const errors: Array<{ row: number; field: string; message: string }> = []
  const tableFields = dataDictionary.filter((e) => e.table_name === tableName)
  const requiredFields = tableFields.filter((e) => e.is_required)

  const validRows: Record<string, unknown>[] = []

  for (let i = 0; i < data.length; i++) {
    const row = data[i]
    let rowValid = true

    for (const field of requiredFields) {
      const val = row[field.field_name]
      const isMissing = val === undefined || val === null || val === ''

      if (isMissing) {
        if (field.missing_value_strategy === 'fill_default' && field.default_value !== null) {
          row[field.field_name] = field.field_type === 'number'
            ? Number(field.default_value)
            : field.default_value
        } else {
          errors.push({
            row: i + 1,
            field: field.field_name,
            message: `必填字段"${field.field_name}"缺失且无默认值`
          })
          rowValid = false
        }
      }
    }

    for (const field of tableFields) {
      const val = row[field.field_name]
      if (val === undefined || val === null || val === '') continue

      if (field.field_type === 'number' && typeof val === 'string') {
        const num = Number(val)
        if (isNaN(num)) {
          errors.push({
            row: i + 1,
            field: field.field_name,
            message: `字段"${field.field_name}"应为数字，实际值"${val}"`
          })
          rowValid = false
        } else {
          row[field.field_name] = num
        }
      }

      if (field.field_type === 'string' && typeof val !== 'string') {
        row[field.field_name] = String(val)
      }
    }

    if (rowValid) {
      validRows.push(row)
    }
  }

  return {
    table_name: tableName,
    total_rows: data.length,
    success_rows: validRows.length,
    error_rows: data.length - validRows.length,
    errors
  }
}

export function assignToTable(
  _data: Record<string, unknown>[],
  headers: string[]
): string {
  const normalizedHeaders = headers.map((h) =>
    h.trim().toLowerCase().replace(/\s+/g, '_')
  )

  let bestMatch = ''
  let bestScore = 0

  for (const [tableName, expectedHeaders] of Object.entries(TABLE_HEADER_MAP)) {
    const normalizedExpected = expectedHeaders.map((h) => h.toLowerCase())
    const matchCount = normalizedHeaders.filter((h) =>
      normalizedExpected.includes(h)
    ).length
    const score = matchCount / normalizedExpected.length

    if (score > bestScore && score >= 0.5) {
      bestScore = score
      bestMatch = tableName
    }
  }

  return bestMatch
}
