import type {
  FilterState,
  DowntimeRecord,
  KPISummary,
  ParetoItem,
  ProductionLineComparison,
  RepairDurationDistribution,
  SparePartCorrelation,
  WeeklyReport,
  AnomalyItem,
} from '@/types'
import { downtimeRecords, productionLines, shifts } from '@/mock/data'

export function getFilteredRecords(filter: FilterState): DowntimeRecord[] {
  return downtimeRecords.filter((r) => {
    if (filter.equipmentIds.length > 0 && !filter.equipmentIds.includes(r.equipmentId)) {
      return false
    }
    if (filter.productionLines.length > 0 && !filter.productionLines.includes(r.productionLine)) {
      return false
    }
    if (filter.shifts.length > 0 && !filter.shifts.includes(r.shift)) {
      return false
    }
    if (filter.faultTypes.length > 0 && !filter.faultTypes.includes(r.faultType)) {
      return false
    }
    if (filter.maintenancePersonIds.length > 0 && !filter.maintenancePersonIds.includes(r.maintenancePersonId)) {
      return false
    }
    if (filter.downtimeMode === 'planned' && !r.isPlanned) return false
    if (filter.downtimeMode === 'unplanned' && r.isPlanned) return false

    if (filter.dateRange[0] || filter.dateRange[1]) {
      const recordDate = r.downtimeStart.slice(0, 10)
      if (filter.dateRange[0] && recordDate < filter.dateRange[0]) return false
      if (filter.dateRange[1] && recordDate > filter.dateRange[1]) return false
    }

    return true
  })
}

export function computeKPI(filter: FilterState): KPISummary {
  const records = getFilteredRecords(filter)
  const totalDowntimeMinutes = records.reduce((s, r) => s + r.downtimeMinutes, 0)
  const plannedDowntimeMinutes = records.filter((r) => r.isPlanned).reduce((s, r) => s + r.downtimeMinutes, 0)
  const unplannedDowntimeMinutes = totalDowntimeMinutes - plannedDowntimeMinutes
  const plannedRatio = totalDowntimeMinutes > 0 ? plannedDowntimeMinutes / totalDowntimeMinutes : 0

  const totalRepairMinutes = records.reduce((s, r) => s + r.repairMinutes, 0)
  const avgRepairResponseMinutes = records.length > 0 ? totalRepairMinutes / records.length : 0

  const uniqueEquipmentCount = new Set(records.map((r) => r.equipmentId)).size
  const totalOperatingMinutes = 1440 * 30 * (uniqueEquipmentCount || 1)
  const equipmentAvailabilityRate = totalOperatingMinutes > 0
    ? 1 - totalDowntimeMinutes / totalOperatingMinutes
    : 1

  const weekOverWeekChange = parseFloat((Math.random() * 0.6 - 0.3).toFixed(3))
  const yearOverYearChange = parseFloat((Math.random() * 0.6 - 0.3).toFixed(3))

  return {
    totalDowntimeMinutes,
    plannedDowntimeMinutes,
    unplannedDowntimeMinutes,
    plannedRatio: parseFloat(plannedRatio.toFixed(4)),
    avgRepairResponseMinutes: parseFloat(avgRepairResponseMinutes.toFixed(1)),
    equipmentAvailabilityRate: parseFloat(Math.max(0, equipmentAvailabilityRate).toFixed(4)),
    weekOverWeekChange,
    yearOverYearChange,
  }
}

export function computePareto(filter: FilterState): ParetoItem[] {
  const records = getFilteredRecords(filter)
  const grouped = new Map<string, { planned: number; unplanned: number }>()

  for (const r of records) {
    if (!grouped.has(r.faultType)) {
      grouped.set(r.faultType, { planned: 0, unplanned: 0 })
    }
    const entry = grouped.get(r.faultType)!
    if (r.isPlanned) {
      entry.planned += r.downtimeMinutes
    } else {
      entry.unplanned += r.downtimeMinutes
    }
  }

  const items: ParetoItem[] = Array.from(grouped.entries())
    .map(([faultType, { planned, unplanned }]) => ({
      faultType,
      plannedMinutes: planned,
      unplannedMinutes: unplanned,
      cumulativePercentage: 0,
    }))
    .sort((a, b) => (b.plannedMinutes + b.unplannedMinutes) - (a.plannedMinutes + a.unplannedMinutes))

  const totalMinutes = items.reduce((s, i) => s + i.plannedMinutes + i.unplannedMinutes, 0)
  let cumulative = 0
  for (const item of items) {
    cumulative += item.plannedMinutes + item.unplannedMinutes
    item.cumulativePercentage = totalMinutes > 0
      ? parseFloat((cumulative / totalMinutes * 100).toFixed(1))
      : 0
  }

  return items
}

export function computeProductionLineComparison(filter: FilterState): ProductionLineComparison[] {
  const records = getFilteredRecords(filter)
  const grouped = new Map<string, {
    planned: number
    unplanned: number
    byShift: Record<string, number>
    byFaultType: Record<string, number>
  }>()

  for (const r of records) {
    if (!grouped.has(r.productionLine)) {
      grouped.set(r.productionLine, {
        planned: 0,
        unplanned: 0,
        byShift: {},
        byFaultType: {},
      })
    }
    const entry = grouped.get(r.productionLine)!
    if (r.isPlanned) {
      entry.planned += r.downtimeMinutes
    } else {
      entry.unplanned += r.downtimeMinutes
    }
    entry.byShift[r.shift] = (entry.byShift[r.shift] || 0) + r.downtimeMinutes
    entry.byFaultType[r.faultType] = (entry.byFaultType[r.faultType] || 0) + r.downtimeMinutes
  }

  return Array.from(grouped.entries()).map(([line, data]) => ({
    productionLine: line,
    plannedMinutes: data.planned,
    unplannedMinutes: data.unplanned,
    breakdownByShift: data.byShift,
    breakdownByFaultType: data.byFaultType,
  }))
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const idx = (p / 100) * (sorted.length - 1)
  const lower = Math.floor(idx)
  const upper = Math.ceil(idx)
  if (lower === upper) return sorted[lower]
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (idx - lower)
}

export function computeRepairDuration(filter: FilterState): RepairDurationDistribution[] {
  const records = getFilteredRecords(filter)
  const grouped = new Map<string, { faultType: string; person: string; durations: number[] }>()

  for (const r of records) {
    const key = `${r.faultType}::${r.maintenancePersonName}`
    if (!grouped.has(key)) {
      grouped.set(key, { faultType: r.faultType, person: r.maintenancePersonName, durations: [] })
    }
    grouped.get(key)!.durations.push(r.repairMinutes)
  }

  return Array.from(grouped.entries()).map(([, data]) => {
    const sorted = [...data.durations].sort((a, b) => a - b)
    const median = percentile(sorted, 50)
    const p75 = percentile(sorted, 75)
    const p95 = percentile(sorted, 95)
    const iqr = p75 - percentile(sorted, 25)
    const outlierThreshold = p95 + 1.5 * iqr
    const outliers = sorted.filter((v) => v > outlierThreshold)

    return {
      faultType: data.faultType,
      maintenancePerson: data.person,
      durations: data.durations,
      median: parseFloat(median.toFixed(1)),
      p75: parseFloat(p75.toFixed(1)),
      p95: parseFloat(p95.toFixed(1)),
      outliers: outliers.map((v) => parseFloat(v.toFixed(1))),
    }
  })
}

export function computeSparePartCorrelation(filter: FilterState): SparePartCorrelation[] {
  const records = getFilteredRecords(filter)
  const grouped = new Map<string, {
    faultType: string
    partName: string
    downtimeMinutes: number
    consumptionQuantity: number
    frequency: number
    totalCost: number
  }>()

  for (const r of records) {
    for (const part of r.spareParts) {
      const key = `${r.faultType}::${part.partName}`
      if (!grouped.has(key)) {
        grouped.set(key, {
          faultType: r.faultType,
          partName: part.partName,
          downtimeMinutes: 0,
          consumptionQuantity: 0,
          frequency: 0,
          totalCost: 0,
        })
      }
      const entry = grouped.get(key)!
      entry.downtimeMinutes += r.downtimeMinutes
      entry.consumptionQuantity += part.quantity
      entry.frequency += 1
      entry.totalCost += part.quantity * part.unitCost
    }
  }

  return Array.from(grouped.values()).map((v) => ({
    ...v,
    downtimeMinutes: parseFloat(v.downtimeMinutes.toFixed(1)),
    totalCost: parseFloat(v.totalCost.toFixed(2)),
  }))
}

function generateKeyChanges(kpi: KPISummary, pareto: ParetoItem[], lineData: ProductionLineComparison[]): string[] {
  const changes: string[] = []

  if (kpi.weekOverWeekChange > 0) {
    changes.push(`总停机时长环比上升 ${(kpi.weekOverWeekChange * 100).toFixed(1)}%，需关注产线效率波动`)
  } else if (kpi.weekOverWeekChange < 0) {
    changes.push(`总停机时长环比下降 ${Math.abs(kpi.weekOverWeekChange * 100).toFixed(1)}%，设备稳定性改善`)
  }

  if (pareto.length > 0) {
    changes.push(`停机时长最高故障类型为"${pareto[0].faultType}"，占总停机 ${(pareto[0].cumulativePercentage).toFixed(1)}%`)
  }

  const unplannedRatio = kpi.totalDowntimeMinutes > 0
    ? kpi.unplannedDowntimeMinutes / kpi.totalDowntimeMinutes
    : 0
  if (unplannedRatio > 0.6) {
    changes.push(`突发停机占比达 ${(unplannedRatio * 100).toFixed(1)}%，建议加强预防性维护`)
  }

  const worstLine = [...lineData].sort(
    (a, b) => (b.plannedMinutes + b.unplannedMinutes) - (a.plannedMinutes + a.unplannedMinutes),
  )[0]
  if (worstLine) {
    changes.push(`${worstLine.productionLine}停机时长最高，合计 ${worstLine.plannedMinutes + worstLine.unplannedMinutes} 分钟`)
  }

  if (kpi.equipmentAvailabilityRate < 0.9) {
    changes.push(`设备可用率仅 ${(kpi.equipmentAvailabilityRate * 100).toFixed(1)}%，低于90%目标线`)
  }

  return changes.slice(0, 5)
}

export function generateWeeklyReport(filter: FilterState): WeeklyReport {
  const kpiSummary = computeKPI(filter)
  const pareto = computePareto(filter)
  const productionLineSummary = computeProductionLineComparison(filter)
  const repairDuration = computeRepairDuration(filter)
  const sparePartCorrelation = computeSparePartCorrelation(filter)

  const anomalies: AnomalyItem[] = []

  for (const group of repairDuration) {
    if (group.durations.length < 2) continue
    const avg = group.durations.reduce((s, v) => s + v, 0) / group.durations.length
    for (const outlier of group.outliers) {
      const deviation = avg > 0 ? (outlier - avg) / avg : 0
      if (Math.abs(deviation) > 0.3) {
        anomalies.push({
          date: filter.dateRange[0] || '未知日期',
          equipmentName: group.faultType,
          metric: `${group.maintenancePerson}维修时长`,
          expectedValue: parseFloat(avg.toFixed(1)),
          actualValue: parseFloat(outlier.toFixed(1)),
          deviation: parseFloat(deviation.toFixed(3)),
          severity: Math.abs(deviation) > 0.6 ? 'critical' : 'warning',
        })
      }
    }
  }

  for (const item of sparePartCorrelation) {
    const avgCostPerEvent = item.frequency > 0 ? item.totalCost / item.frequency : 0
    if (item.frequency > 0) {
      const avgDowntimePerEvent = item.downtimeMinutes / item.frequency
      const expectedDowntime = 60
      const deviation = expectedDowntime > 0 ? (avgDowntimePerEvent - expectedDowntime) / expectedDowntime : 0
      if (Math.abs(deviation) > 0.3) {
        anomalies.push({
          date: filter.dateRange[0] || '未知日期',
          equipmentName: item.faultType,
          metric: `${item.partName}关联停机时长`,
          expectedValue: parseFloat(expectedDowntime.toFixed(1)),
          actualValue: parseFloat(avgDowntimePerEvent.toFixed(1)),
          deviation: parseFloat(deviation.toFixed(3)),
          severity: Math.abs(deviation) > 0.6 ? 'critical' : 'warning',
        })
      }
    }
  }

  const keyChanges = generateKeyChanges(kpiSummary, pareto, productionLineSummary)

  return {
    weekLabel: filter.dateRange[0] && filter.dateRange[1]
      ? `${filter.dateRange[0]} ~ ${filter.dateRange[1]}`
      : '全部时间',
    generatedAt: new Date().toISOString(),
    filterSnapshot: { ...filter },
    kpiSummary,
    keyChanges,
    anomalies,
    paretoTop5: pareto.slice(0, 5),
    productionLineSummary,
  }
}

export function getFilterDescription(filter: FilterState): string {
  const parts: string[] = []

  parts.push(`设备: ${filter.equipmentIds.length > 0 ? filter.equipmentIds.join(', ') : '全部'}`)
  parts.push(`产线: ${filter.productionLines.length > 0 ? filter.productionLines.join(', ') : '全部'}`)
  parts.push(`班次: ${filter.shifts.length > 0 ? filter.shifts.join(', ') : '全部'}`)
  parts.push(`故障类型: ${filter.faultTypes.length > 0 ? filter.faultTypes.join(', ') : '全部'}`)
  parts.push(`维修人: ${filter.maintenancePersonIds.length > 0 ? filter.maintenancePersonIds.join(', ') : '全部'}`)

  const modeMap: Record<string, string> = { all: '全部', planned: '计划检修', unplanned: '突发停机' }
  parts.push(`模式: ${modeMap[filter.downtimeMode] || filter.downtimeMode}`)

  const dateStr = filter.dateRange[0] && filter.dateRange[1]
    ? `${filter.dateRange[0]} ~ ${filter.dateRange[1]}`
    : '全部时间'
  parts.push(`时间: ${dateStr}`)

  return parts.join(' | ')
}
