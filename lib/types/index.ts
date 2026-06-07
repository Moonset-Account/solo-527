export interface Coordinate {
  lng: number
  lat: number
}

export interface TransferStation {
  id: string
  name: string
  code: string
  location: Coordinate
  province: string
  city: string
  level: 'hub' | 'regional' | 'local'
}

export interface Vehicle {
  id: string
  plateNumber: string
  type: string
  capacity: number
  status: 'active' | 'maintenance' | 'idle'
  teamId: string
}

export interface LoadingTeam {
  id: string
  name: string
  stationId: string
  shift: 'day' | 'night' | 'all'
  size: number
}

export interface WeatherRecord {
  id: string
  stationId: string
  timestamp: Date
  condition: 'sunny' | 'cloudy' | 'rain' | 'snow' | 'fog' | 'storm'
  temperature: number
  windSpeed: number
  visibility: number
}

export interface ScanRecord {
  id: string
  waybillId: string
  vehicleId: string
  stationId: string
  scanType: 'arrival' | 'departure' | 'loading' | 'unloading'
  timestamp: Date
  operatorId: string
  location: Coordinate
}

export interface Waybill {
  id: string
  waybillNumber: string
  originStationId: string
  destStationId: string
  vehicleId: string
  createdTime: Date
  estimatedArrival: Date
  actualArrival: Date | null
  status: 'in_transit' | 'delivered' | 'delayed' | 'exception'
  priority: 'normal' | 'urgent' | 'vip'
}

export interface DelayRecord {
  id: string
  waybillId: string
  stationId: string
  vehicleId: string
  arrivalScanId: string
  departureScanId: string | null
  arrivalTime: Date
  departureTime: Date | null
  businessDay: string
  durationMinutes: number
  isOvernight: boolean
  isDelayed: boolean
  delayCategory: 'loading' | 'weather' | 'vehicle' | 'traffic' | 'other' | null
  loadingTeamId: string | null
  attributedToTeam: boolean
}

export interface ExceptionRecord {
  id: string
  waybillId: string
  stationId: string
  timestamp: Date
  type: 'vehicle_breakdown' | 'weather_delay' | 'loading_delay' | 'package_damage' | 'traffic_jam' | 'other'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  handlingStatus: 'pending' | 'processing' | 'resolved'
  handlerId: string | null
}

export interface StationAggregate {
  stationId: string
  stationName: string
  location: Coordinate
  totalWaybills: number
  delayedWaybills: number
  averageDurationMinutes: number
  delayRate: number
  exceptions: number
  weatherConditions: WeatherRecord['condition'][]
}

export interface PathAggregate {
  id: string
  originStationId: string
  destStationId: string
  originName: string
  destName: string
  waybillCount: number
  delayCount: number
  averageDurationMinutes: number
  averageDelayMinutes: number
  path: Coordinate[]
  isDelayed: boolean
  topReasons: { category: string; count: number }[]
}

export interface FilterParams {
  startDate?: string
  endDate?: string
  stationIds?: string[]
  vehicleIds?: string[]
  teamIds?: string[]
  weatherConditions?: string[]
  delayCategories?: string[]
  severityLevels?: string[]
  minDelayMinutes?: number
  spatialBounds?: {
    minLng: number
    maxLng: number
    minLat: number
    maxLat: number
  }
}

export interface UserPermission {
  role: 'admin' | 'dispatcher' | 'viewer'
  canViewDetails: boolean
  canExport: boolean
  canViewSensitive: boolean
  accessibleStationIds: string[] | null
}

export interface ScanSequenceItem {
  scan: ScanRecord
  station: TransferStation
  weather?: WeatherRecord
  durationToNext?: number
}
