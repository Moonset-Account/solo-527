import request, { PaginatedResponse } from './index'

export interface AuditLog {
  id: number
  user: number | null
  user_name: string
  username: string
  action: string
  action_display: string
  resource_type: string
  resource_id: string
  resource_name: string
  method: string
  path: string
  ip_address: string
  status_code: number
  detail: string
  is_success: boolean
  error_message: string
  duration_ms: number
  created_at: string
}

export const auditApi = {
  list: (params?: any) =>
    request.get<any, PaginatedResponse<AuditLog>>('/audits/logs/', { params }),

  detail: (id: number) =>
    request.get<any, AuditLog>(`/audits/logs/${id}/`),
}
