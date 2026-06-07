export interface InboundRecord {
  sku_id: string
  sku_name: string
  batch_no: string
  warehouse_position: string
  supplier_id: string
  supplier_name: string
  inbound_date: string
  quantity: number
  unit_cost: number
  expiry_date: string | null
}

export interface OutboundRecord {
  sku_id: string
  batch_no: string
  outbound_date: string
  quantity: number
  outbound_type: 'sale' | 'transfer' | 'return_out'
}

export interface InventoryAgeRecord {
  sku_id: string
  batch_no: string
  warehouse_position: string
  current_quantity: number
  age_days: number
  age_bucket: '0-30' | '30-60' | '60-90' | '90-180' | '180+'
  expiry_date: string | null
  days_to_expiry: number | null
  is_near_expiry: boolean
}

export interface ReturnRecord {
  sku_id: string
  batch_no: string
  return_date: string
  quantity: number
  return_reason: string
}

export interface SafetyStockRecord {
  sku_id: string
  warehouse_position: string
  safety_stock_qty: number
  reorder_point: number
  lead_time_days: number
}

export interface FilterState {
  sku_ids: string[]
  warehouse_positions: string[]
  supplier_ids: string[]
  batch_nos: string[]
  age_buckets: string[]
  date_range: { start: string; end: string }
}

export interface FunnelData {
  total_inbound: number
  current_inventory: number
  effective_turnover: number
  fast_turnover: number
}

export interface TurnoverRanking {
  sku_id: string
  sku_name: string
  batch_no: string
  turnover_rate: number
  avg_age_days: number
  current_qty: number
  rank_type: 'top' | 'bottom'
}

export interface ReplenishmentSuggestion {
  sku_id: string
  sku_name: string
  warehouse_position: string
  current_qty: number
  safety_stock_qty: number
  gap: number
  priority: 'urgent' | 'high' | 'medium' | 'low'
  suggested_qty: number
  lead_time_days: number
}

export interface NearExpiryAlert {
  sku_id: string
  sku_name: string
  batch_no: string
  warehouse_position: string
  expiry_date: string
  days_to_expiry: number
  current_quantity: number
  total_quantity: number
  ratio: number
}

export interface AnomalyPoint {
  id: string
  metric: string
  sku_id: string
  sku_name: string
  batch_no: string
  description: string
  severity: 'high' | 'medium' | 'low'
  detected_at: string
  value: number
  expected_range: { min: number; max: number }
}

export interface WeeklyReport {
  report_id: string
  week_start: string
  week_end: string
  key_changes: string[]
  yoy_comparison: Record<string, { current: number; previous: number; change_pct: number }>
  mom_comparison: Record<string, { current: number; previous: number; change_pct: number }>
  anomalies: Array<{ metric: string; description: string; severity: 'high' | 'medium' | 'low' }>
  filter_snapshot: FilterState
  generated_at: string
}

export interface ValidationRule {
  rule_id: string
  metric_name: string
  formula: string
  description: string
  expected_range: { min: number; max: number }
  is_active: boolean
}

export interface DrillDownPath {
  path_id: string
  name: string
  levels: Array<{ field: string; label: string; order: number }>
}

export interface DataDictionaryEntry {
  table_name: string
  field_name: string
  field_type: string
  description: string
  value_range: string
  business_meaning: string
  is_required: boolean
  missing_value_strategy: 'ignore' | 'fill_default' | 'mark_anomaly'
  default_value: string | null
}

export interface UserRole {
  role_id: string
  role_name: string
  accessible_warehouses: string[]
  accessible_suppliers: string[]
  accessible_sku_categories: string[]
}

export interface ImportResult {
  table_name: string
  total_rows: number
  success_rows: number
  error_rows: number
  errors: Array<{ row: number; field: string; message: string }>
}
