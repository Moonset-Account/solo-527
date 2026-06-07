export interface FilterState {
  equipmentIds: string[]
  productionLines: string[]
  shifts: ('早班' | '中班' | '夜班')[]
  faultTypes: string[]
  maintenancePersonIds: string[]
  downtimeMode: 'all' | 'planned' | 'unplanned'
  dateRange: [string, string]
}

export interface SparePartConsumption {
  partId: string
  partName: string
  quantity: number
  unitCost: number
}

export interface DowntimeRecord {
  id: string
  equipmentId: string
  equipmentName: string
  productionLine: string
  shift: '早班' | '中班' | '夜班'
  faultType: string
  downtimeStart: string
  downtimeEnd: string
  downtimeMinutes: number
  isPlanned: boolean
  maintenancePersonId: string
  maintenancePersonName: string
  repairStart: string
  repairEnd: string
  repairMinutes: number
  spareParts: SparePartConsumption[]
}

export interface KPISummary {
  totalDowntimeMinutes: number
  plannedDowntimeMinutes: number
  unplannedDowntimeMinutes: number
  plannedRatio: number
  avgRepairResponseMinutes: number
  equipmentAvailabilityRate: number
  weekOverWeekChange: number
  yearOverYearChange: number
}

export interface ParetoItem {
  faultType: string
  plannedMinutes: number
  unplannedMinutes: number
  cumulativePercentage: number
}

export interface ProductionLineComparison {
  productionLine: string
  plannedMinutes: number
  unplannedMinutes: number
  breakdownByShift: Record<string, number>
  breakdownByFaultType: Record<string, number>
}

export interface RepairDurationDistribution {
  faultType: string
  maintenancePerson: string
  durations: number[]
  median: number
  p75: number
  p95: number
  outliers: number[]
}

export interface SparePartCorrelation {
  faultType: string
  partName: string
  downtimeMinutes: number
  consumptionQuantity: number
  frequency: number
  totalCost: number
}

export interface AnomalyItem {
  date: string
  equipmentName: string
  metric: string
  expectedValue: number
  actualValue: number
  deviation: number
  severity: 'warning' | 'critical'
}

export interface Equipment {
  id: string
  name: string
  productionLine: string
  equipmentType: string
}

export interface MaintenancePerson {
  id: string
  name: string
  team: string
}

export interface WeeklyReport {
  weekLabel: string
  generatedAt: string
  filterSnapshot: FilterState
  kpiSummary: KPISummary
  keyChanges: string[]
  anomalies: AnomalyItem[]
  paretoTop5: ParetoItem[]
  productionLineSummary: ProductionLineComparison[]
}
