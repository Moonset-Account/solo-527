export interface Community {
  id: string
  name: string
  district: string
  householdCount: number
}

export type BinPointStatus = 'normal' | 'warning' | 'full' | 'abnormal'

export interface BinPoint {
  id: string
  communityId: string
  name: string
  lng: number
  lat: number
  status: BinPointStatus
  binCount: number
  gridCode: string
  fillLevel: number
  lastUpdate: string
}

export type MisuseType = 'recyclable' | 'hazardous' | 'kitchen' | 'other'
export type AuditStatus = 'pending' | 'approved' | 'rejected'

export interface MisuseRecord {
  id: string
  binPointId: string
  recordDate: string
  misuseType: MisuseType
  misuseRate: number
  auditStatus: AuditStatus
  auditor?: string
  auditTime?: string
}

export type AlertLevel = 'low' | 'medium' | 'high'
export type AlertStatus = 'pending' | 'processing' | 'resolved'

export interface FullAlert {
  id: string
  binPointId: string
  alertTime: string
  handleTime?: string
  level: AlertLevel
  status: AlertStatus
  handler?: string
}

export interface CollectionLog {
  id: string
  binPointId: string
  planTime: string
  actualTime?: string
  timeWindow: string
  isHoliday: boolean
  status: 'pending' | 'completed' | 'delayed'
  vehicleNo?: string
}

export interface InspectionPhoto {
  id: string
  binPointId: string
  uploader: string
  uploadTime: string
  photoUrl: string
  auditStatus: AuditStatus
  auditLogId?: string
}

export interface AuditLog {
  id: string
  photoId: string
  auditor: string
  auditTime: string
  result: 'approved' | 'rejected'
  rejectReason?: string
}

export interface ReturnVisit {
  id: string
  binPointId: string
  visitTime: string
  visitor: string
  issueType: string
  rectification: string
  status: 'pending' | 'completed'
  photos?: string[]
}

export interface HolidaySchedule {
  date: string
  name: string
  isWorkday: boolean
}

export interface User {
  id: string
  name: string
  role: 'manager' | 'auditor' | 'public'
  avatar?: string
}

export interface MapBounds {
  minLng: number
  maxLng: number
  minLat: number
  maxLat: number
}

export interface GeoPoint {
  type: 'Point'
  coordinates: [number, number]
}

export interface GeoFeature {
  type: 'Feature'
  properties: Record<string, any>
  geometry: {
    type: string
    coordinates: any
  }
}

export interface GeoJson {
  type: 'FeatureCollection'
  features: GeoFeature[]
}
