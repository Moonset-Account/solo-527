export interface Building {
  id: string
  name: string
  totalArea: number
  createdAt: string
}

export interface Floor {
  id: string
  buildingId: string
  floorNumber: number
  area: number
  name: string
}

export interface Tenant {
  id: string
  floorId: string
  name: string
  area: number
  peopleCount: number
  contact: string
}

export type DeviceType = 'electricity' | 'water' | 'hvac'
export type DeviceStatus = 'online' | 'offline' | 'warning'

export interface Device {
  id: string
  floorId: string
  type: DeviceType
  name: string
  status: DeviceStatus
  lastOnline: string
  location: string
}

export interface EnergyReading {
  id: string
  deviceId: string
  timestamp: string
  value: number
  quality: 'good' | 'bad' | 'uncertain'
  isOffline: boolean
}

export type AlertType = 'device_offline' | 'energy_spike' | 'energy_drop' | 'missing_reading'
export type AlertLevel = 'critical' | 'warning' | 'info'
export type AlertStatus = 'open' | 'acknowledged' | 'resolved'

export interface Alert {
  id: string
  deviceId: string
  deviceName: string
  type: AlertType
  level: AlertLevel
  message: string
  createdAt: string
  status: AlertStatus
  handledAt?: string
  handledBy?: string
  note?: string
}

export type AllocationMethod = 'by_area' | 'by_people' | 'by_usage_ratio' | 'even'

export interface AllocationRule {
  id: string
  name: string
  method: AllocationMethod
  params: Record<string, any>
  isActive: boolean
  createdAt: string
}

export interface AllocationResult {
  id: string
  ruleId: string
  tenantId: string
  tenantName: string
  period: string
  commonEnergy: number
  allocatedEnergy: number
  tenantUsage: number
  totalEnergy: number
  formula: string
}

export interface TimeOfUsePrice {
  period: 'peak' | 'valley' | 'flat' | 'critical'
  startTime: string
  endTime: string
  price: number
  name: string
}

export interface EnergyStats {
  total: number
  peak: number
  valley: number
  flat: number
  critical: number
  unit: string
  sampleCount: number
  totalSamples: number
}

export type TimeRange = 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom'
export type Dimension = 'building' | 'floor' | 'tenant' | 'device'

export interface ReportConfig {
  title: string
  startTime: string
  endTime: string
  dimension: Dimension
  dimensionId?: string
  includeAllocation: boolean
  allocationRuleId?: string
}

export interface ReportData {
  config: ReportConfig
  sampleCount: number
  timeWindow: string
  allocationMethod?: string
  summary: EnergyStats
  details: any[]
  generatedAt: string
}

export interface ChartDataPoint {
  timestamp: string
  value: number
  label: string
  isOffline?: boolean
}

export interface HolidayMode {
  workdayStart: string
  workdayEnd: string
  weekendReduction: number
  holidayReduction: number
}
