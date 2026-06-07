export interface Station {
  id: string
  name: string
  latitude: number
  longitude: number
  totalDocks: number
  availableBikes: number
  availableDocks: number
  bikesInRepair: number
}

export interface Ride {
  id: string
  originStationId: string
  destStationId: string
  startTime: string
  endTime: string
  weatherId: string
  period: 'morning_rush' | 'evening_rush' | 'normal'
}

export interface Dispatch {
  id: string
  fromStationId: string
  toStationId: string
  bikeCount: number
  dispatchTime: string
  completedTime: string
  status: 'completed' | 'pending' | 'in_progress'
}

export interface RepairRecord {
  id: string
  stationId: string
  bikeId: string
  reportTime: string
  reason: string
  status: 'repairing' | 'completed'
}

export interface Weather {
  id: string
  date: string
  condition: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'windy'
  temperature: number
  humidity: number
  windSpeed: number
}

export type TimePeriod = 'morning_rush' | 'evening_rush' | 'all_day' | 'custom'
export type VehicleStatus = 'dispatchable' | 'in_repair' | 'all'
export type DispatchStatusFilter = 'all' | 'completed' | 'pending' | 'in_progress'

export interface FilterState {
  stationIds: string[]
  routeIds: string[]
  timePeriod: TimePeriod
  customTimeRange: [string, string] | null
  vehicleStatus: VehicleStatus
  dispatchStatus: DispatchStatusFilter
  weatherConditions: string[]
}

export interface StationAlert {
  stationId: string
  stationName: string
  type: 'low_stock' | 'high_repair_ratio' | 'supply_demand_imbalance'
  severity: 'critical' | 'warning' | 'info'
  message: string
  value: number
  threshold: number
}

export interface AggregatedStation extends Station {
  availableBikesForDispatch: number
  inflow: number
  outflow: number
  netFlow: number
  repairRatio: number
}

export interface WeeklyReportData {
  weekStart: string
  weekEnd: string
  totalRides: number
  totalDispatches: number
  avgAvailability: number
  criticalAlerts: number
  ridesWoW: number
  ridesYoY: number
  availabilityWoW: number
  anomalies: Array<{
    stationId: string
    stationName: string
    metric: string
    expected: number
    actual: number
    deviation: number
  }>
  filterSnapshot: FilterState
  nullCount: number
}

export interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}
