export interface EnergyOverview {
  todayUsage: number
  monthUsage: number
  yesterdayUsage: number
  lastMonthUsage: number
  peakUsage: number
  peakRatio: number
}

export interface EnergyCurvePoint {
  time: string
  value: number
  isPeak: boolean
}

export interface ZoneEnergyComparison {
  zoneId: number
  zoneName: string
  usage: number
  percentage: number
}

export interface Meter {
  id: number
  meterNo: string
  location: string
  zoneId: number
  zoneName: string
  status: 'online' | 'offline' | 'fault'
  lastSyncTime: string
  lastSyncStatus: 'success' | 'failed' | 'pending'
  sourceDocumentNo: string
  remark: string
  createdAt: string
}

export interface Zone {
  id: number
  name: string
  meterCount: number
  totalUsage: number
  createdAt: string
  sourceDocumentNo: string
  remark: string
}

export interface Alarm {
  id: number
  type: 'peak_anomaly' | 'device_fault' | 'data_anomaly' | 'communication_loss'
  level: 'critical' | 'warning' | 'info'
  meterId: number
  meterNo: string
  zoneName: string
  message: string
  status: 'pending' | 'confirmed' | 'processing' | 'resolved'
  assignee: string
  occurredAt: string
  confirmedAt: string | null
  resolvedAt: string | null
  responseDuration: number | null
  rootCause: string
  sourceDocumentNo: string
  remark: string
}

export interface AlarmReview {
  month: string
  totalAlarms: number
  resolvedAlarms: number
  avgResponseMinutes: number
  topCauses: Array<{ cause: string; count: number }>
  assigneeStats: Array<{ assignee: string; count: number; avgResponse: number }>
  levelDistribution: Record<string, number>
}

export interface Subsidy {
  id: number
  type: string
  amount: number
  sourceDocumentNo: string
  sourceDocumentUrl: string
  remark: string
  createdBy: string
  createdAt: string
  approvedBy: string | null
  approvedAt: string | null
  status: 'pending' | 'approved' | 'rejected'
}

export interface SyncTask {
  id: number
  type: 'meter_reading' | 'meter_config' | 'alarm_sync'
  meterId: number
  meterNo: string
  status: 'pending' | 'running' | 'success' | 'failed'
  triggeredAt: string
  completedAt: string | null
  duration: number | null
  failReason: string | null
  friendlyFailReason: string | null
  failCategory: 'network' | 'data' | 'config' | 'unknown' | null
  retryCount: number
  retryResults: Array<{
    retryAt: string
    success: boolean
    message: string
  }>
}

export interface DataQueryParams {
  startTime: string
  endTime: string
  zoneId?: number
  meterId?: number
  dataType: 'usage' | 'peak' | 'demand'
  granularity: 'hour' | 'day' | 'month'
}

export interface DataQueryResult {
  total: number
  items: Array<{
    time: string
    meterNo: string
    zoneName: string
    value: number
    unit: string
  }>
}

export interface PageResult<T> {
  total: number
  items: T[]
}

export interface UserInfo {
  id: number
  username: string
  role: 'admin' | 'manager' | 'operator'
  realName: string
}
