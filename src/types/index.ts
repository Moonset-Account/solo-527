export type DowntimeType = 'planned' | 'unplanned'

export interface FilterState {
  equipmentIds: string[]
  productionLines: string[]
  shifts: string[]
  faultTypes: string[]
  maintenancePeople: string[]
  dateRange: [string, string]
  downtimeType: 'all' | 'planned' | 'unplanned'
}

export interface DowntimeRecord {
  id: string
  equipmentId: string
  equipmentName: string
  productionLine: string
  shift: string
  faultType: string
  downtimeType: DowntimeType
  startTime: string
  endTime: string
  duration: number
  maintenancePerson: string
  maintenanceDuration: number
  spareParts: SparePartUsage[]
}

export interface SparePartUsage {
  partId: string
  partName: string
  quantity: number
  unitCost: number
}

export interface KPIMetrics {
  totalDowntime: number
  downtimeCount: number
  avgRepairDuration: number
  plannedRatio: number
  mtbf: number
  mttr: number
}

export interface ParetoItem {
  faultType: string
  duration: number
  count: number
  cumulativePercent: number
  plannedDuration: number
  unplannedDuration: number
}

export interface ProductionLineComparison {
  line: string
  plannedDuration: number
  unplannedDuration: number
  plannedCount: number
  unplannedCount: number
}

export interface TrendPoint {
  date: string
  plannedDuration: number
  unplannedDuration: number
  totalDuration: number
}

export interface Annotation {
  id: string
  date: string
  content: string
  author: string
  createdAt: string
  tags: string[]
}

export interface SparePartRanking {
  partName: string
  totalQuantity: number
  totalCost: number
  associatedDowntimeCount: number
}

export interface SparePartFaultMatrix {
  partNames: string[]
  faultTypes: string[]
  values: number[][]
}

export interface MaintenancePersonStats {
  person: string
  orderCount: number
  avgDuration: number
  avgResponseTime: number
  plannedCount: number
  unplannedCount: number
}

export interface MetricConfig {
  key: string
  label: string
  unit: string
  plannedOnly: boolean
  unplannedOnly: boolean
  aggregation: 'sum' | 'avg' | 'count' | 'max' | 'min'
  decimalPlaces: number
}

export interface CacheEntry<T> {
  data: T
  timestamp: number
  filterHash: string
  ttl: number
}

export interface EquipmentOption {
  id: string
  name: string
  productionLine: string
}

export interface DrillDownState {
  faultType: string | null
  equipmentId: string | null
  productionLine: string | null
}
