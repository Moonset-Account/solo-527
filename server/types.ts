export interface CommunityRow {
  id: string; name: string; district: string; household_count: number
}

export interface BinPointRow {
  id: string; community_id: string; name: string; lng: number; lat: number
  geo_hash: string; status: string; bin_count: number; grid_code: string
  fill_level: number; last_update: string
}

export interface MisuseRecordRow {
  id: string; bin_point_id: string; record_date: string; misuse_type: string
  misuse_rate: number; audit_status: string; auditor: string | null; audit_time: string | null
}

export interface FullAlertRow {
  id: string; bin_point_id: string; alert_time: string; handle_time: string | null
  level: string; status: string; handler: string | null
}

export interface CollectionLogRow {
  id: string; bin_point_id: string; plan_time: string; actual_time: string | null
  time_window: string; is_holiday: number; status: string; vehicle_no: string | null
}

export interface InspectionPhotoRow {
  id: string; bin_point_id: string; uploader: string; upload_time: string
  photo_url: string; audit_status: string; audit_log_id: string | null
}

export interface AuditLogRow {
  id: string; photo_id: string; auditor: string; audit_time: string
  result: string; reject_reason: string | null
}

export interface ReturnVisitRow {
  id: string; bin_point_id: string; visit_time: string; visitor: string
  issue_type: string; rectification: string; status: string
}

export interface HolidayScheduleRow {
  date: string; name: string; is_workday: number
}

export interface ClickHouseDB {
  communities: CommunityRow[]
  binPoints: BinPointRow[]
  misuseRecords: MisuseRecordRow[]
  fullAlerts: FullAlertRow[]
  collectionLogs: CollectionLogRow[]
  inspectionPhotos: InspectionPhotoRow[]
  auditLogs: AuditLogRow[]
  returnVisits: ReturnVisitRow[]
  holidays: HolidayScheduleRow[]
}

export interface QueryLog {
  timestamp: string
  sql: string
  params: Record<string, any>
  durationMs: number
  rowCount: number
}

export const queryLogs: QueryLog[] = []

export function logQuery(sql: string, params: Record<string, any>, durationMs: number, rowCount: number) {
  queryLogs.push({
    timestamp: new Date().toISOString(),
    sql: sql.replace(/\s+/g, ' ').trim(),
    params,
    durationMs,
    rowCount
  })
  if (queryLogs.length > 200) queryLogs.shift()
  console.log(`[ClickHouse] ${sql.replace(/\s+/g, ' ').trim().substring(0, 120)}... → ${rowCount} rows (${durationMs}ms)`)
}
