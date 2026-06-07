import type { AppointmentRecord } from '../../shared/types.js'
import { mockRecords } from '../data/mockData.js'

type Dimension = 'grade' | 'counselingType' | 'timePeriod' | 'channel' | 'status'
type Metric = 'appointmentCount' | 'cancelRate' | 'avgWaitDays' | 'followUpRate'

const dimensionFieldMap: Record<Dimension, keyof AppointmentRecord> = {
  grade: 'grade',
  counselingType: 'counselingType',
  timePeriod: 'appointmentDate',
  channel: 'channel',
  status: 'status',
}

function filterByTimeRange(records: AppointmentRecord[], start: string, end: string): AppointmentRecord[] {
  return records.filter(r => r.appointmentDate >= start && r.appointmentDate <= end)
}

function filterByDimensions(records: AppointmentRecord[], filters: Record<string, string[]>): AppointmentRecord[] {
  let filtered = records
  for (const [key, values] of Object.entries(filters)) {
    if (values.length === 0) continue
    if (key === 'timePeriod') {
      filtered = filtered.filter(r => {
        const month = r.appointmentDate.substring(0, 7)
        return values.includes(month) || values.includes(r.appointmentDate)
      })
    } else {
      const field = key as keyof AppointmentRecord
      filtered = filtered.filter(r => values.includes(String(r[field])))
    }
  }
  return filtered
}

function getGroupValue(record: AppointmentRecord, dimension: Dimension): string {
  if (dimension === 'timePeriod') {
    return record.appointmentDate.substring(0, 7)
  }
  return String(record[dimensionFieldMap[dimension]])
}

function calcMetric(records: AppointmentRecord[], metric: Metric): number {
  switch (metric) {
    case 'appointmentCount':
      return records.length
    case 'cancelRate': {
      const relevant = records.filter(r => ['completed', 'cancelled', 'noShow'].includes(r.status))
      if (relevant.length === 0) return 0
      const cancelled = relevant.filter(r => r.status === 'cancelled').length
      return Math.round((cancelled / relevant.length) * 10000) / 100
    }
    case 'avgWaitDays': {
      const withWait = records.filter(r => ['appointed', 'completed'].includes(r.status))
      if (withWait.length === 0) return 0
      const sum = withWait.reduce((acc, r) => acc + r.waitDays, 0)
      return Math.round((sum / withWait.length) * 100) / 100
    }
    case 'followUpRate': {
      const completed = records.filter(r => r.status === 'completed')
      if (completed.length === 0) return 0
      const followed = completed.filter(r => r.followUpStatus === 'completed').length
      return Math.round((followed / completed.length) * 10000) / 100
    }
  }
}

export function aggregate(
  dimensions: Dimension[],
  metrics: Metric[],
  timeRange: { start: string; end: string },
  filters?: Record<string, string[]>
): Array<Record<string, string | number>> {
  let records = filterByTimeRange(mockRecords, timeRange.start, timeRange.end)
  if (filters) {
    records = filterByDimensions(records, filters)
  }

  if (dimensions.length === 0) {
    const row: Record<string, string | number> = {}
    for (const m of metrics) {
      row[m] = calcMetric(records, m)
    }
    return [row]
  }

  const groups = new Map<string, AppointmentRecord[]>()
  for (const r of records) {
    const key = dimensions.map(d => getGroupValue(r, d)).join('|')
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(r)
  }

  const result: Array<Record<string, string | number>> = []
  for (const [key, groupRecords] of groups) {
    const row: Record<string, string | number> = {}
    const parts = key.split('|')
    dimensions.forEach((d, i) => {
      row[d] = parts[i]
    })
    for (const m of metrics) {
      row[m] = calcMetric(groupRecords, m)
    }
    result.push(row)
  }

  return result.sort((a, b) => {
    const firstDim = dimensions[0]
    return String(a[firstDim]).localeCompare(String(b[firstDim]))
  })
}

export function queryDetail(
  filters: Record<string, string | string[]>,
  page: number,
  pageSize: number,
  sortBy?: string,
  sortOrder?: 'asc' | 'desc'
): { records: AppointmentRecord[]; total: number } {
  let records = [...mockRecords]

  for (const [key, values] of Object.entries(filters)) {
    const valArr = Array.isArray(values) ? values : [values]
    if (valArr.length === 0) continue
    const field = key as keyof AppointmentRecord
    records = records.filter(r => valArr.includes(String(r[field])))
  }

  if (sortBy) {
    const field = sortBy as keyof AppointmentRecord
    records.sort((a, b) => {
      const va = a[field]
      const vb = b[field]
      const cmp = typeof va === 'number' && typeof vb === 'number'
        ? va - vb
        : String(va).localeCompare(String(vb))
      return sortOrder === 'desc' ? -cmp : cmp
    })
  }

  const total = records.length
  const start = (page - 1) * pageSize
  const paged = records.slice(start, start + pageSize)

  return { records: paged, total }
}
