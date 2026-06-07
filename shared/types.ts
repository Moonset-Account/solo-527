export interface AppointmentRecord {
  id: string
  anonymousId: string
  grade: string
  counselingType: string
  channel: string
  status: 'appointed' | 'completed' | 'cancelled' | 'noShow'
  waitDays: number
  cancelReason?: string
  followUpStatus: 'pending' | 'completed' | 'overdue'
  appointmentDate: string
  buildingArea: string
  lng: number
  lat: number
}

export interface Note {
  id: string
  targetKey: string
  content: string
  author: string
  createdAt: string
}

export interface CaliberDefinition {
  metricKey: string
  metricName: string
  definition: string
  formula: string
  updateTime: string
}

export type Dimension = 'grade' | 'counselingType' | 'timePeriod' | 'channel' | 'status'
export type Metric = 'appointmentCount' | 'cancelRate' | 'avgWaitDays' | 'followUpRate'

export interface AggregationQuery {
  dimensions: Dimension[]
  metrics: Metric[]
  timeRange: { start: string; end: string }
  filters?: Record<string, string[]>
}

export interface AggregationResponse {
  data: Array<Record<string, string | number>>
  caliberNotes: Array<{ metric: string; definition: string; formula: string }>
}

export interface DetailQuery {
  filters: Record<string, string | string[]>
  page: number
  pageSize: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface DetailResponse {
  records: AppointmentRecord[]
  total: number
  page: number
  caliberNote: string
}
