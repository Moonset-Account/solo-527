import request, { PaginatedResponse } from './index'

export interface ChangeLog {
  id: number
  change_window: number
  action: string
  old_status: string
  old_status_display: string
  new_status: string
  new_status_display: string
  detail: string
  is_failure: boolean
  failure_reason: string
  operator: number | null
  operator_name: string
  operated_at: string
}

export interface ChangeWindow {
  id: number
  code: string
  name: string
  change_type: string
  change_type_display: string
  status: string
  status_display: string
  description: string
  plan_content: string
  rollback_plan: string
  risk_assessment: string
  start_time: string
  end_time: string
  actual_start: string
  actual_end: string
  applicant: number | null
  applicant_name: string
  approver: number | null
  approver_name: string
  executor: number | null
  executor_name: string
  approved_at: string
  result_summary: string
  servers: number[]
  server_names: any[]
  server_count: number
  logs?: ChangeLog[]
  created_at: string
}

export const changeApi = {
  list: (params?: any) =>
    request.get<any, PaginatedResponse<ChangeWindow>>('/changes/windows/', { params }),

  detail: (id: number) =>
    request.get<any, ChangeWindow>(`/changes/windows/${id}/`),

  create: (data: any) =>
    request.post('/changes/windows/', data),

  update: (id: number, data: any) =>
    request.put(`/changes/windows/${id}/`, data),

  approve: (id: number, data?: any) =>
    request.post(`/changes/windows/${id}/approve/`, data || {}),

  reject: (id: number, data?: any) =>
    request.post(`/changes/windows/${id}/reject/`, data || {}),

  start: (id: number, data?: any) =>
    request.post(`/changes/windows/${id}/start/`, data || {}),

  complete: (id: number, data?: any) =>
    request.post(`/changes/windows/${id}/complete/`, data || {}),

  cancel: (id: number, data?: any) =>
    request.post(`/changes/windows/${id}/cancel/`, data || {}),

  logs: (params?: any) =>
    request.get<any, PaginatedResponse<ChangeLog>>('/changes/logs/', { params }),
}
