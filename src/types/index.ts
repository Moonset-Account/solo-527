export type UserRole = 'researcher' | 'archivist' | 'admin' | 'equipment_teacher'

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'
export type ProcessingStatus = 'pending' | 'in_progress' | 'completed'
export type InstrumentStatus = 'available' | 'in_use' | 'disabled'
export type StationStatus = 'available' | 'occupied' | 'disabled'
export type ApiStatusType = 'healthy' | 'degraded' | 'down'
export type PermissionRequestStatus = 'pending' | 'approved' | 'rejected'

export interface AuthUser {
  id: string
  email: string
  role: UserRole
  display_name: string
  lab_id: string
}

export interface Lab {
  id: string
  name: string
  description: string | null
  created_at: string
}

export interface Instrument {
  id: string
  name: string
  category: string
  status: InstrumentStatus
  teacher_id: string | null
  location: string | null
  specifications: Record<string, string>
  created_at: string
}

export interface Station {
  id: string
  name: string
  instrument_id: string
  status: StationStatus
  created_at: string
}

export interface Project {
  id: string
  name: string
  code: string
  description: string | null
  lead_id: string | null
  start_date: string | null
  end_date: string | null
  created_at: string
}

export interface Sample {
  id: string
  sample_code: string
  name: string
  project_id: string | null
  created_by: string | null
  processing_status: ProcessingStatus
  responsible_person: string | null
  created_at: string
}

export interface Booking {
  id: string
  user_id: string
  instrument_id: string
  station_id: string
  project_id: string | null
  start_time: string
  end_time: string
  status: BookingStatus
  notes: string | null
  created_at: string
  instrument?: Instrument
  station?: Station
  project?: Project
  samples?: Sample[]
}

export interface BookingCreateRequest {
  instrument_id: string
  station_id: string
  start_time: string
  end_time: string
  sample_ids: string[]
  project_id: string
  notes?: string
}

export interface ArchiveRecord {
  id: string
  user_id: string
  project_id: string | null
  sample_id: string | null
  file_url: string
  file_name: string
  processing_status: ProcessingStatus
  responsible_person: string | null
  metadata: Record<string, string>
  archived_at: string
  project?: Project
  sample?: Sample
}

export interface DeactivationAlert {
  id: string
  instrument_id: string
  reason: string
  resolved: boolean
  deactivated_at: string
  resolved_at: string | null
  resolved_by: string | null
  instrument?: Instrument
}

export interface UtilizationLog {
  id: string
  instrument_id: string
  instrument_name?: string
  log_date: string
  total_hours: number
  used_hours: number
  disabled_hours: number
  created_at: string
  instrument?: Instrument
}

export interface DailyUtilization {
  instrument_id: string
  instrument_name: string
  date: string
  used_hours: number
  disabled_hours: number
  utilization_rate: number
}

export interface PermissionRequest {
  id: string
  user_id: string
  requested_role: UserRole
  status: PermissionRequestStatus
  reason: string | null
  reviewed_by: string | null
  created_at: string
  reviewed_at: string | null
  user?: AuthUser
}

export interface AuditLog {
  id: string
  user_id: string | null
  action: string
  resource_type: string
  resource_id: string | null
  details: Record<string, unknown>
  created_at: string
  user?: AuthUser
}

export interface ApiStatusRecord {
  id: string
  service_name: string
  status: ApiStatusType
  response_time_ms: number | null
  checked_at: string
}

export interface FilterParams {
  date_from?: string
  date_to?: string
  processing_status?: ProcessingStatus
  responsible_person?: string
  project_id?: string
  instrument_id?: string
}

export interface SampleTracking {
  sample_id: string
  timeline: Array<{
    timestamp: string
    action: string
    operator: string
    location: string
    notes: string
  }>
}

export interface ProjectReport {
  project_id: string
  project_name: string
  booking_count: number
  total_hours: number
  sample_count: number
  team_members: string[]
}

export const ROLE_LABELS: Record<UserRole, string> = {
  researcher: '一线实验人员',
  archivist: '内部归档人员',
  admin: '实验室管理员',
  equipment_teacher: '设备负责老师',
}

export const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: '待确认',
  confirmed: '已确认',
  cancelled: '已取消',
  completed: '已完成',
}

export const PROCESSING_STATUS_LABELS: Record<ProcessingStatus, string> = {
  pending: '待处理',
  in_progress: '进行中',
  completed: '已完成',
}

export const INSTRUMENT_STATUS_LABELS: Record<InstrumentStatus, string> = {
  available: '可用',
  in_use: '使用中',
  disabled: '已停用',
}

export const API_STATUS_LABELS: Record<ApiStatusType, string> = {
  healthy: '正常',
  degraded: '降级',
  down: '故障',
}
