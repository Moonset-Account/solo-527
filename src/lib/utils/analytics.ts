import type {
  FilterState,
  FunnelData,
  TurnoverRanking,
  ReplenishmentSuggestion,
  NearExpiryAlert,
  AnomalyPoint,
  WeeklyReport,
  InboundRecord,
  OutboundRecord,
  InventoryAgeRecord,
  ReturnRecord,
  SafetyStockRecord
} from '$lib/types'

export interface DataSource {
  inbound: InboundRecord[]
  outbound: OutboundRecord[]
  inventoryAge: InventoryAgeRecord[]
  returns: ReturnRecord[]
  safetyStock: SafetyStockRecord[]
  skuNames: Record<string, string>
}

function filterByCommon<T extends { sku_id?: string; batch_no?: string; warehouse_position?: string; supplier_id?: string }>(
  data: T[],
  filters: Partial<FilterState>
): T[] {
  return data.filter((row) => {
    if (filters.sku_ids?.length && row.sku_id && !filters.sku_ids.includes(row.sku_id)) return false
    if (filters.batch_nos?.length && row.batch_no && !filters.batch_nos.includes(row.batch_no)) return false
    if (filters.warehouse_positions?.length && row.warehouse_position && !filters.warehouse_positions.includes(row.warehouse_position)) return false
    if (filters.supplier_ids?.length && row.supplier_id && !filters.supplier_ids.includes(row.supplier_id)) return false
    return true
  })
}

function filterInbound(data: InboundRecord[], filters: Partial<FilterState>): InboundRecord[] {
  return data.filter((row) => {
    if (filters.sku_ids?.length && !filters.sku_ids.includes(row.sku_id)) return false
    if (filters.batch_nos?.length && !filters.batch_nos.includes(row.batch_no)) return false
    if (filters.warehouse_positions?.length && !filters.warehouse_positions.includes(row.warehouse_position)) return false
    if (filters.supplier_ids?.length && !filters.supplier_ids.includes(row.supplier_id)) return false
    if (filters.date_range?.start && row.inbound_date < filters.date_range.start) return false
    if (filters.date_range?.end && row.inbound_date > filters.date_range.end) return false
    return true
  })
}

function filterOutbound(data: OutboundRecord[], filters: Partial<FilterState>): OutboundRecord[] {
  return data.filter((row) => {
    if (filters.sku_ids?.length && !filters.sku_ids.includes(row.sku_id)) return false
    if (filters.batch_nos?.length && !filters.batch_nos.includes(row.batch_no)) return false
    if (filters.date_range?.start && row.outbound_date < filters.date_range.start) return false
    if (filters.date_range?.end && row.outbound_date > filters.date_range.end) return false
    return true
  })
}

function filterInventoryAge(data: InventoryAgeRecord[], filters: Partial<FilterState>): InventoryAgeRecord[] {
  return data.filter((row) => {
    if (filters.sku_ids?.length && !filters.sku_ids.includes(row.sku_id)) return false
    if (filters.batch_nos?.length && !filters.batch_nos.includes(row.batch_no)) return false
    if (filters.warehouse_positions?.length && !filters.warehouse_positions.includes(row.warehouse_position)) return false
    if (filters.age_buckets?.length && !filters.age_buckets.includes(row.age_bucket)) return false
    return true
  })
}

export function mergePermissionToFilter(
  filters: Partial<FilterState>,
  accessibleWarehouses: string[],
  accessibleSuppliers: string[],
  accessibleSkuCategories: string[]
): Partial<FilterState> {
  const merged: Partial<FilterState> = { ...filters }

  if (accessibleWarehouses.length > 0) {
    if (filters.warehouse_positions?.length) {
      merged.warehouse_positions = filters.warehouse_positions.filter((w) => accessibleWarehouses.includes(w))
    } else {
      merged.warehouse_positions = [...accessibleWarehouses]
    }
  }

  if (accessibleSuppliers.length > 0) {
    if (filters.supplier_ids?.length) {
      merged.supplier_ids = filters.supplier_ids.filter((s) => accessibleSuppliers.includes(s))
    } else {
      merged.supplier_ids = [...accessibleSuppliers]
    }
  }

  if (accessibleSkuCategories.length > 0) {
    if (filters.sku_ids?.length) {
      merged.sku_ids = filters.sku_ids.filter((s) => accessibleSkuCategories.includes(s))
    } else {
      merged.sku_ids = [...accessibleSkuCategories]
    }
  }

  return merged
}

export function computeFunnelData(ds: DataSource, filters: Partial<FilterState> = {}): FunnelData {
  const inbound = filterInbound(ds.inbound, filters)
  const outbound = filterOutbound(ds.outbound, filters)
  const inventory = filterInventoryAge(ds.inventoryAge, filters)

  const totalInbound = inbound.reduce((s, r) => s + r.quantity, 0)
  const currentInventory = inventory.reduce((s, r) => s + r.current_quantity, 0)
  const totalOutbound = outbound.reduce((s, r) => s + r.quantity, 0)
  const saleOutbound = outbound.filter((r) => r.outbound_type === 'sale').reduce((s, r) => s + r.quantity, 0)

  const effectiveTurnover = totalInbound > 0 ? totalOutbound / totalInbound : 0
  const fastTurnover = totalInbound > 0 ? saleOutbound / totalInbound : 0

  return {
    total_inbound: totalInbound,
    current_inventory: currentInventory,
    effective_turnover: Math.round(effectiveTurnover * 10000) / 10000,
    fast_turnover: Math.round(fastTurnover * 10000) / 10000
  }
}

export function computeAgeDistribution(
  ds: DataSource,
  filters: Partial<FilterState> = {}
): Array<{ age_bucket: string; batch_no: string; quantity: number }> {
  const inventory = filterInventoryAge(ds.inventoryAge, filters)
  const grouped = new Map<string, number>()

  for (const row of inventory) {
    const key = `${row.age_bucket}||${row.batch_no}`
    grouped.set(key, (grouped.get(key) || 0) + row.current_quantity)
  }

  const result: Array<{ age_bucket: string; batch_no: string; quantity: number }> = []
  for (const [key, qty] of grouped) {
    const [age_bucket, batch_no] = key.split('||')
    result.push({ age_bucket, batch_no, quantity: qty })
  }

  const bucketOrder = ['0-30', '30-60', '60-90', '90-180', '180+']
  result.sort((a, b) => {
    const ai = bucketOrder.indexOf(a.age_bucket) - bucketOrder.indexOf(b.age_bucket)
    return ai !== 0 ? ai : a.batch_no.localeCompare(b.batch_no)
  })

  return result
}

export function computeTurnoverRanking(ds: DataSource, filters: Partial<FilterState> = {}): TurnoverRanking[] {
  const inbound = filterInbound(ds.inbound, filters)
  const outbound = filterOutbound(ds.outbound, filters)
  const inventory = filterInventoryAge(ds.inventoryAge, filters)

  const inboundMap = new Map<string, { qty: number; sku_name: string }>()
  for (const r of inbound) {
    const key = `${r.sku_id}||${r.batch_no}`
    const existing = inboundMap.get(key)
    if (existing) {
      existing.qty += r.quantity
    } else {
      inboundMap.set(key, { qty: r.quantity, sku_name: r.sku_name })
    }
  }

  const outboundMap = new Map<string, number>()
  for (const r of outbound) {
    const key = `${r.sku_id}||${r.batch_no}`
    outboundMap.set(key, (outboundMap.get(key) || 0) + r.quantity)
  }

  const inventoryMap = new Map<string, { qty: number; age_days: number }>()
  for (const r of inventory) {
    const key = `${r.sku_id}||${r.batch_no}`
    const existing = inventoryMap.get(key)
    if (existing) {
      existing.qty += r.current_quantity
      existing.age_days = Math.max(existing.age_days, r.age_days)
    } else {
      inventoryMap.set(key, { qty: r.current_quantity, age_days: r.age_days })
    }
  }

  const allKeys = new Set([...inboundMap.keys(), ...outboundMap.keys(), ...inventoryMap.keys()])
  const rankings: TurnoverRanking[] = []

  for (const key of allKeys) {
    const [sku_id, batch_no] = key.split('||')
    const inData = inboundMap.get(key)
    const outQty = outboundMap.get(key) || 0
    const invData = inventoryMap.get(key)

    const inQty = inData?.qty || 0
    const turnoverRate = inQty > 0 ? outQty / inQty : 0
    const skuName = inData?.sku_name || ds.skuNames[sku_id] || sku_id

    rankings.push({
      sku_id,
      sku_name: skuName,
      batch_no,
      turnover_rate: Math.round(turnoverRate * 10000) / 10000,
      avg_age_days: invData?.age_days || 0,
      current_qty: invData?.qty || 0,
      rank_type: turnoverRate >= 0.5 ? 'top' : 'bottom'
    })
  }

  rankings.sort((a, b) => b.turnover_rate - a.turnover_rate)
  return rankings
}

export function computeReplenishment(ds: DataSource, filters: Partial<FilterState> = {}): ReplenishmentSuggestion[] {
  const inventory = filterInventoryAge(ds.inventoryAge, filters)
  const safety = filterByCommon(ds.safetyStock, filters)

  const inventoryBySku = new Map<string, number>()
  for (const r of inventory) {
    inventoryBySku.set(r.sku_id, (inventoryBySku.get(r.sku_id) || 0) + r.current_quantity)
  }

  const results: ReplenishmentSuggestion[] = []

  for (const ss of safety) {
    const currentQty = inventoryBySku.get(ss.sku_id) || 0
    const gap = currentQty - ss.reorder_point

    if (gap < 0) {
      let priority: ReplenishmentSuggestion['priority']
      if (currentQty < ss.safety_stock_qty) {
        priority = 'urgent'
      } else if (currentQty < ss.reorder_point * 0.7) {
        priority = 'high'
      } else if (currentQty < ss.reorder_point) {
        priority = 'medium'
      } else {
        priority = 'low'
      }

      const suggestedQty = ss.reorder_point - currentQty + ss.safety_stock_qty

      results.push({
        sku_id: ss.sku_id,
        sku_name: ds.skuNames[ss.sku_id] || ss.sku_id,
        warehouse_position: ss.warehouse_position,
        current_qty: currentQty,
        safety_stock_qty: ss.safety_stock_qty,
        gap: Math.abs(gap),
        priority,
        suggested_qty: Math.max(suggestedQty, ss.safety_stock_qty),
        lead_time_days: ss.lead_time_days
      })
    }
  }

  results.sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })

  return results
}

export function computeNearExpiryAlerts(ds: DataSource, filters: Partial<FilterState> = {}): NearExpiryAlert[] {
  const inventory = filterInventoryAge(ds.inventoryAge, filters)
  const results: NearExpiryAlert[] = []

  for (const r of inventory) {
    if (!r.is_near_expiry || r.days_to_expiry === null) continue
    if (r.days_to_expiry > 30 || r.days_to_expiry < -90) continue

    results.push({
      sku_id: r.sku_id,
      sku_name: ds.skuNames[r.sku_id] || r.sku_id,
      batch_no: r.batch_no,
      warehouse_position: r.warehouse_position,
      expiry_date: r.expiry_date || '',
      days_to_expiry: r.days_to_expiry,
      current_quantity: r.current_quantity,
      total_quantity: r.current_quantity,
      ratio: 1
    })
  }

  const grouped = new Map<string, NearExpiryAlert[]>()
  for (const alert of results) {
    const key = `${alert.sku_id}||${alert.expiry_date}`
    const group = grouped.get(key) || []
    group.push(alert)
    grouped.set(key, group)
  }

  const merged: NearExpiryAlert[] = []
  for (const group of grouped.values()) {
    const totalQty = group.reduce((s, a) => s + a.current_quantity, 0)
    merged.push({
      ...group[0],
      total_quantity: totalQty,
      ratio: group[0].current_quantity / totalQty
    })
  }

  merged.sort((a, b) => a.days_to_expiry - b.days_to_expiry)
  return merged
}

export function detectAnomalies(ds: DataSource, filters: Partial<FilterState> = {}): AnomalyPoint[] {
  const anomalies: AnomalyPoint[] = []
  const now = new Date('2026-06-08')

  const inbound = filterInbound(ds.inbound, filters)
  const outbound = filterOutbound(ds.outbound, filters)
  const inventory = filterInventoryAge(ds.inventoryAge, filters)

  const outBySku = new Map<string, { total: number; byWeek: Map<string, number> }>()
  for (const r of outbound) {
    const d = new Date(r.outbound_date)
    const weekStart = new Date(d)
    weekStart.setDate(d.getDate() - d.getDay())
    const weekKey = weekStart.toISOString().slice(0, 10)

    const existing = outBySku.get(r.sku_id)
    if (existing) {
      existing.total += r.quantity
      existing.byWeek.set(weekKey, (existing.byWeek.get(weekKey) || 0) + r.quantity)
    } else {
      const byWeek = new Map<string, number>()
      byWeek.set(weekKey, r.quantity)
      outBySku.set(r.sku_id, { total: r.quantity, byWeek })
    }
  }

  const inBySku = new Map<string, number>()
  for (const r of inbound) {
    inBySku.set(r.sku_id, (inBySku.get(r.sku_id) || 0) + r.quantity)
  }

  for (const [skuId, data] of outBySku) {
    const weeks = Array.from(data.byWeek.values())
    if (weeks.length < 2) continue
    const avg = weeks.reduce((s, v) => s + v, 0) / weeks.length
    const stdDev = Math.sqrt(weeks.reduce((s, v) => s + (v - avg) ** 2, 0) / weeks.length)
    const latestWeek = weeks[weeks.length - 1]

    if (avg > 0 && latestWeek < avg - 2 * stdDev) {
      anomalies.push({
        id: `anomaly_drop_${skuId}`,
        metric: '周转率下降',
        sku_id: skuId,
        sku_name: ds.skuNames[skuId] || skuId,
        batch_no: '',
        description: `近一周出库量(${latestWeek})显著低于均值(${Math.round(avg)})`,
        severity: latestWeek < avg * 0.3 ? 'high' : 'medium',
        detected_at: now.toISOString().slice(0, 10),
        value: latestWeek,
        expected_range: { min: Math.round(avg - 2 * stdDev), max: Math.round(avg + 2 * stdDev) }
      })
    }
  }

  for (const r of inventory) {
    if (r.current_quantity > 300) {
      const inQty = inBySku.get(r.sku_id) || 0
      const outQty = outBySku.get(r.sku_id)?.total || 0
      const ratio = inQty > 0 ? outQty / inQty : 0

      if (ratio < 0.3) {
        anomalies.push({
          id: `anomaly_spike_${r.sku_id}_${r.batch_no}`,
          metric: '库存积压',
          sku_id: r.sku_id,
          sku_name: ds.skuNames[r.sku_id] || r.sku_id,
          batch_no: r.batch_no,
          description: `库存量(${r.current_quantity})异常偏高，周转率仅${(ratio * 100).toFixed(1)}%`,
          severity: r.current_quantity > 400 ? 'high' : 'medium',
          detected_at: now.toISOString().slice(0, 10),
          value: r.current_quantity,
          expected_range: { min: 10, max: 300 }
        })
      }
    }
  }

  for (const r of inventory) {
    if (r.age_days > 180 && r.current_quantity > 100) {
      anomalies.push({
        id: `anomaly_stale_${r.sku_id}_${r.batch_no}`,
        metric: '滞销库存',
        sku_id: r.sku_id,
        sku_name: ds.skuNames[r.sku_id] || r.sku_id,
        batch_no: r.batch_no,
        description: `库龄${r.age_days}天且库存量${r.current_quantity}，疑似滞销`,
        severity: r.age_days > 200 ? 'high' : 'medium',
        detected_at: now.toISOString().slice(0, 10),
        value: r.age_days,
        expected_range: { min: 0, max: 180 }
      })
    }
  }

  const retData = filterByCommon(ds.returns, filters)
  const returnBySku = new Map<string, number>()
  for (const r of retData) {
    returnBySku.set(r.sku_id, (returnBySku.get(r.sku_id) || 0) + r.quantity)
  }
  for (const [skuId, retQty] of returnBySku) {
    const outQty = outBySku.get(skuId)?.total || 0
    if (outQty > 0 && retQty / outQty > 0.15) {
      anomalies.push({
        id: `anomaly_return_${skuId}`,
        metric: '退货率异常',
        sku_id: skuId,
        sku_name: ds.skuNames[skuId] || skuId,
        batch_no: '',
        description: `退货率${((retQty / outQty) * 100).toFixed(1)}%超出正常范围`,
        severity: retQty / outQty > 0.25 ? 'high' : 'low',
        detected_at: now.toISOString().slice(0, 10),
        value: retQty / outQty,
        expected_range: { min: 0, max: 0.15 }
      })
    }
  }

  return anomalies
}

export function computeWeeklyReport(ds: DataSource, filters: Partial<FilterState> = {}): WeeklyReport {
  const now = new Date('2026-06-08')
  const weekEnd = new Date(now)
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - 6)

  const fmt = (d: Date) => d.toISOString().slice(0, 10)

  const inbound = filterInbound(ds.inbound, filters)
  const outbound = filterOutbound(ds.outbound, filters)
  const inventory = filterInventoryAge(ds.inventoryAge, filters)
  const rets = filterByCommon(ds.returns, filters)

  const totalInbound = inbound.reduce((s, r) => s + r.quantity, 0)
  const totalOutbound = outbound.reduce((s, r) => s + r.quantity, 0)
  const currentInventory = inventory.reduce((s, r) => s + r.current_quantity, 0)
  const totalReturns = rets.reduce((s, r) => s + r.quantity, 0)
  const nearExpiryCount = inventory.filter((r) => r.is_near_expiry).length
  const avgAge = inventory.length > 0
    ? Math.round(inventory.reduce((s, r) => s + r.age_days, 0) / inventory.length)
    : 0

  const currentMetrics: Record<string, number> = {
    入库总量: totalInbound,
    出库总量: totalOutbound,
    当前库存: currentInventory,
    退货总量: totalReturns,
    临期批次数: nearExpiryCount,
    平均库龄: avgAge
  }

  const prevWeekStart = new Date(weekStart)
  prevWeekStart.setDate(prevWeekStart.getDate() - 7)
  const prevWeekEnd = new Date(weekStart)
  prevWeekEnd.setDate(prevWeekEnd.getDate() - 1)

  const prevInbound = inbound.filter((r) => r.inbound_date >= fmt(prevWeekStart) && r.inbound_date <= fmt(prevWeekEnd))
  const prevOutbound = outbound.filter((r) => r.outbound_date >= fmt(prevWeekStart) && r.outbound_date <= fmt(prevWeekEnd))

  const prevMetrics: Record<string, number> = {
    入库总量: prevInbound.reduce((s, r) => s + r.quantity, 0),
    出库总量: prevOutbound.reduce((s, r) => s + r.quantity, 0),
    当前库存: currentInventory,
    退货总量: totalReturns,
    临期批次数: nearExpiryCount,
    平均库龄: avgAge
  }

  const momComparison: Record<string, { current: number; previous: number; change_pct: number }> = {}
  for (const key of Object.keys(currentMetrics)) {
    const current = currentMetrics[key]
    const previous = prevMetrics[key] || 0
    const changePct = previous !== 0 ? Math.round(((current - previous) / previous) * 10000) / 100 : 0
    momComparison[key] = { current, previous, change_pct: changePct }
  }

  const lastYearStart = new Date(weekStart)
  lastYearStart.setFullYear(lastYearStart.getFullYear() - 1)
  const lastYearEnd = new Date(weekEnd)
  lastYearEnd.setFullYear(lastYearEnd.getFullYear() - 1)

  const yoyInbound = inbound.filter((r) => r.inbound_date >= fmt(lastYearStart) && r.inbound_date <= fmt(lastYearEnd))
  const yoyOutbound = outbound.filter((r) => r.outbound_date >= fmt(lastYearStart) && r.outbound_date <= fmt(lastYearEnd))

  const yoyPrevious: Record<string, number> = {
    入库总量: yoyInbound.reduce((s, r) => s + r.quantity, 0),
    出库总量: yoyOutbound.reduce((s, r) => s + r.quantity, 0),
    当前库存: currentInventory,
    退货总量: totalReturns,
    临期批次数: nearExpiryCount,
    平均库龄: avgAge
  }

  const yoyComparison: Record<string, { current: number; previous: number; change_pct: number }> = {}
  for (const key of Object.keys(currentMetrics)) {
    const current = currentMetrics[key]
    const previous = yoyPrevious[key] || 0
    const changePct = previous !== 0 ? Math.round(((current - previous) / previous) * 10000) / 100 : 0
    yoyComparison[key] = { current, previous, change_pct: changePct }
  }

  const anomalies = detectAnomalies(ds, filters)

  const keyChanges: string[] = []
  if (momComparison['入库总量'].change_pct > 20) {
    keyChanges.push(`入库量环比增长${momComparison['入库总量'].change_pct}%`)
  }
  if (momComparison['入库总量'].change_pct < -20) {
    keyChanges.push(`入库量环比下降${Math.abs(momComparison['入库总量'].change_pct)}%`)
  }
  if (momComparison['出库总量'].change_pct > 20) {
    keyChanges.push(`出库量环比增长${momComparison['出库总量'].change_pct}%`)
  }
  if (momComparison['出库总量'].change_pct < -20) {
    keyChanges.push(`出库量环比下降${Math.abs(momComparison['出库总量'].change_pct)}%`)
  }
  if (nearExpiryCount > 0) {
    keyChanges.push(`${nearExpiryCount}个批次临近过期`)
  }
  if (anomalies.length > 0) {
    keyChanges.push(`检测到${anomalies.length}个异常指标`)
  }
  const replenishments = computeReplenishment(ds, filters)
  if (replenishments.length > 0) {
    keyChanges.push(`${replenishments.length}个SKU需补货`)
  }
  if (keyChanges.length === 0) {
    keyChanges.push('本周库存运转正常，无显著异常')
  }

  return {
    report_id: `RPT-${fmt(weekStart).replace(/-/g, '')}`,
    week_start: fmt(weekStart),
    week_end: fmt(weekEnd),
    key_changes: keyChanges,
    yoy_comparison: yoyComparison,
    mom_comparison: momComparison,
    anomalies: anomalies.map((a) => ({
      metric: a.metric,
      description: a.description,
      severity: a.severity
    })),
    filter_snapshot: {
      sku_ids: filters.sku_ids || [],
      warehouse_positions: filters.warehouse_positions || [],
      supplier_ids: filters.supplier_ids || [],
      batch_nos: filters.batch_nos || [],
      age_buckets: filters.age_buckets || [],
      date_range: filters.date_range || { start: '', end: '' }
    },
    generated_at: now.toISOString()
  }
}
