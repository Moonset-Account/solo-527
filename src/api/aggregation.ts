import type {
  DowntimeRecord,
  FilterState,
  KPIMetrics,
  ParetoItem,
  ProductionLineComparison,
  TrendPoint,
  SparePartRanking,
  SparePartFaultMatrix,
  MaintenancePersonStats,
} from '@/types'
import { getMockRecords } from '@/data/mock'
import { getCache, setCache } from './cache'
import dayjs from 'dayjs'

function applyFilters(records: DowntimeRecord[], filters: FilterState): DowntimeRecord[] {
  return records.filter(r => {
    if (filters.equipmentIds.length > 0 && !filters.equipmentIds.includes(r.equipmentId)) return false
    if (filters.productionLines.length > 0 && !filters.productionLines.includes(r.productionLine)) return false
    if (filters.shifts.length > 0 && !filters.shifts.includes(r.shift)) return false
    if (filters.faultTypes.length > 0 && !filters.faultTypes.includes(r.faultType)) return false
    if (filters.maintenancePeople.length > 0 && !filters.maintenancePeople.includes(r.maintenancePerson)) return false
    if (filters.downtimeType !== 'all' && r.downtimeType !== filters.downtimeType) return false
    const rDate = r.startTime.split('T')[0]
    if (rDate < filters.dateRange[0] || rDate > filters.dateRange[1]) return false
    return true
  })
}

export function getFilteredRecords(filters: FilterState): DowntimeRecord[] {
  const cacheKey = 'filteredRecords'
  const cached = getCache<DowntimeRecord[]>(cacheKey, filters as unknown as Record<string, unknown>)
  if (cached) return cached.data

  const allRecords = getMockRecords()
  const filtered = applyFilters(allRecords, filters)
  setCache(cacheKey, filtered, filters as unknown as Record<string, unknown>)
  return filtered
}

export function getKPIMetrics(filters: FilterState): KPIMetrics {
  const records = getFilteredRecords(filters)
  const totalDowntime = records.reduce((s, r) => s + r.duration, 0)
  const downtimeCount = records.length
  const avgRepairDuration = downtimeCount > 0
    ? records.reduce((s, r) => s + r.maintenanceDuration, 0) / downtimeCount
    : 0
  const plannedDuration = records.filter(r => r.downtimeType === 'planned').reduce((s, r) => s + r.duration, 0)
  const plannedRatio = totalDowntime > 0 ? (plannedDuration / totalDowntime) * 100 : 0

  const unplannedRecords = records.filter(r => r.downtimeType === 'unplanned')
  const totalUnplannedMinutes = unplannedRecords.reduce((s, r) => s + r.duration, 0)
  const dateRangeDays = dayjs(filters.dateRange[1]).diff(dayjs(filters.dateRange[0]), 'day') + 1
  const totalOperatingHours = dateRangeDays * 24
  const mtbf = unplannedRecords.length > 1
    ? (totalOperatingHours - totalUnplannedMinutes / 60) / (unplannedRecords.length - 1)
    : totalOperatingHours
  const mttr = unplannedRecords.length > 0
    ? (totalUnplannedMinutes / 60) / unplannedRecords.length
    : 0

  return {
    totalDowntime,
    downtimeCount,
    avgRepairDuration: Math.round(avgRepairDuration * 10) / 10,
    plannedRatio: Math.round(plannedRatio * 10) / 10,
    mtbf: Math.round(mtbf * 10) / 10,
    mttr: Math.round(mttr * 10) / 10,
  }
}

export function getParetoData(filters: FilterState): ParetoItem[] {
  const records = getFilteredRecords(filters)
  const byType = new Map<string, { duration: number; count: number; planned: number; unplanned: number }>()

  for (const r of records) {
    const existing = byType.get(r.faultType) || { duration: 0, count: 0, planned: 0, unplanned: 0 }
    existing.duration += r.duration
    existing.count += 1
    if (r.downtimeType === 'planned') existing.planned += r.duration
    else existing.unplanned += r.duration
    byType.set(r.faultType, existing)
  }

  const items = Array.from(byType.entries())
    .map(([faultType, v]) => ({ faultType, ...v }))
    .sort((a, b) => b.duration - a.duration)

  const totalDuration = items.reduce((s, i) => s + i.duration, 0)
  let cumulative = 0
  return items.map(item => {
    cumulative += item.duration
    return {
      faultType: item.faultType,
      duration: item.duration,
      count: item.count,
      cumulativePercent: totalDuration > 0 ? Math.round((cumulative / totalDuration) * 1000) / 10 : 0,
      plannedDuration: item.planned,
      unplannedDuration: item.unplanned,
    }
  })
}

export function getProductionLineComparison(filters: FilterState): ProductionLineComparison[] {
  const records = getFilteredRecords(filters)
  const byLine = new Map<string, { plannedDuration: number; unplannedDuration: number; plannedCount: number; unplannedCount: number }>()

  for (const r of records) {
    const existing = byLine.get(r.productionLine) || { plannedDuration: 0, unplannedDuration: 0, plannedCount: 0, unplannedCount: 0 }
    if (r.downtimeType === 'planned') {
      existing.plannedDuration += r.duration
      existing.plannedCount += 1
    } else {
      existing.unplannedDuration += r.duration
      existing.unplannedCount += 1
    }
    byLine.set(r.productionLine, existing)
  }

  return Array.from(byLine.entries()).map(([line, v]) => ({ line, ...v }))
}

export function getTrendData(filters: FilterState): TrendPoint[] {
  const records = getFilteredRecords(filters)
  const byDate = new Map<string, { planned: number; unplanned: number }>()

  const start = dayjs(filters.dateRange[0])
  const end = dayjs(filters.dateRange[1])
  for (let d = start; d.isBefore(end) || d.isSame(end, 'day'); d = d.add(1, 'day')) {
    byDate.set(d.format('YYYY-MM-DD'), { planned: 0, unplanned: 0 })
  }

  for (const r of records) {
    const dateKey = dayjs(r.startTime).format('YYYY-MM-DD')
    const existing = byDate.get(dateKey)
    if (existing) {
      if (r.downtimeType === 'planned') existing.planned += r.duration
      else existing.unplanned += r.duration
    }
  }

  return Array.from(byDate.entries()).map(([date, v]) => ({
    date,
    plannedDuration: v.planned,
    unplannedDuration: v.unplanned,
    totalDuration: v.planned + v.unplanned,
  }))
}

export function getMaintenancePersonStats(filters: FilterState): MaintenancePersonStats[] {
  const records = getFilteredRecords(filters)
  const byPerson = new Map<string, { durations: number[]; plannedCount: number; unplannedCount: number }>()

  for (const r of records) {
    const existing = byPerson.get(r.maintenancePerson) || { durations: [], plannedCount: 0, unplannedCount: 0 }
    existing.durations.push(r.maintenanceDuration)
    if (r.downtimeType === 'planned') existing.plannedCount += 1
    else existing.unplannedCount += 1
    byPerson.set(r.maintenancePerson, existing)
  }

  return Array.from(byPerson.entries()).map(([person, v]) => ({
    person,
    orderCount: v.durations.length,
    avgDuration: Math.round((v.durations.reduce((s, d) => s + d, 0) / v.durations.length) * 10) / 10,
    avgResponseTime: Math.round((Math.random() * 30 + 10) * 10) / 10,
    plannedCount: v.plannedCount,
    unplannedCount: v.unplannedCount,
  }))
}

export function getSparePartRanking(filters: FilterState, topN: number = 10): SparePartRanking[] {
  const records = getFilteredRecords(filters)
  const byPart = new Map<string, { totalQuantity: number; totalCost: number; count: number }>()

  for (const r of records) {
    for (const sp of r.spareParts) {
      const existing = byPart.get(sp.partName) || { totalQuantity: 0, totalCost: 0, count: 0 }
      existing.totalQuantity += sp.quantity
      existing.totalCost += sp.quantity * sp.unitCost
      existing.count += 1
      byPart.set(sp.partName, existing)
    }
  }

  return Array.from(byPart.entries())
    .map(([partName, v]) => ({ partName, ...v, associatedDowntimeCount: v.count }))
    .sort((a, b) => b.totalCost - a.totalCost)
    .slice(0, topN)
}

export function getSparePartFaultMatrix(filters: FilterState): SparePartFaultMatrix {
  const records = getFilteredRecords(filters)
  const partSet = new Set<string>()
  const faultSet = new Set<string>()
  const matrix = new Map<string, number>()

  for (const r of records) {
    faultSet.add(r.faultType)
    for (const sp of r.spareParts) {
      partSet.add(sp.partName)
      const key = `${sp.partName}|||${r.faultType}`
      matrix.set(key, (matrix.get(key) || 0) + sp.quantity)
    }
  }

  const partNames = Array.from(partSet).sort()
  const faultTypes = Array.from(faultSet).sort()
  const values = partNames.map(p =>
    faultTypes.map(f => matrix.get(`${p}|||${f}`) || 0)
  )

  return { partNames, faultTypes, values }
}

export function getMaintenanceDurationDistribution(filters: FilterState): { bin: string; planned: number; unplanned: number }[] {
  const records = getFilteredRecords(filters)
  const bins = ['0-30', '30-60', '60-120', '120-180', '180-240', '240-360', '360+']
  const result = bins.map(b => ({ bin: b, planned: 0, unplanned: 0 }))

  for (const r of records) {
    let binIdx: number
    if (r.maintenanceDuration <= 30) binIdx = 0
    else if (r.maintenanceDuration <= 60) binIdx = 1
    else if (r.maintenanceDuration <= 120) binIdx = 2
    else if (r.maintenanceDuration <= 180) binIdx = 3
    else if (r.maintenanceDuration <= 240) binIdx = 4
    else if (r.maintenanceDuration <= 360) binIdx = 5
    else binIdx = 6

    if (r.downtimeType === 'planned') result[binIdx].planned += 1
    else result[binIdx].unplanned += 1
  }

  return result
}

export function getSparePartTrend(filters: FilterState): { date: string; consumption: number; downtimeDuration: number }[] {
  const records = getFilteredRecords(filters)
  const byDate = new Map<string, { consumption: number; downtimeDuration: number }>()

  const start = dayjs(filters.dateRange[0])
  const end = dayjs(filters.dateRange[1])
  for (let d = start; d.isBefore(end) || d.isSame(end, 'day'); d = d.add(1, 'day')) {
    byDate.set(d.format('YYYY-MM-DD'), { consumption: 0, downtimeDuration: 0 })
  }

  for (const r of records) {
    const dateKey = dayjs(r.startTime).format('YYYY-MM-DD')
    const existing = byDate.get(dateKey)
    if (existing) {
      existing.downtimeDuration += r.duration
      for (const sp of r.spareParts) {
        existing.consumption += sp.quantity * sp.unitCost
      }
    }
  }

  return Array.from(byDate.entries()).map(([date, v]) => ({ date, ...v }))
}
