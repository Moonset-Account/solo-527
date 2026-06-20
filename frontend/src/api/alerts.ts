import request, { PaginatedResponse } from './index'

export interface AlertRecord {
  id: number
  alert: number
  action: string
  old_status: string
  old_status_display: string
  new_status: string
  new_status_display: string
  comment: string
  processed_at: string
  processed_by: number | null
  processed_by_name: string
}

export interface AlertAttachment {
  id: number
  alert: number
  file: string
  file_url: string
  file_name: string
  file_size: number
  content_type: string
  uploaded_by_name: string
  created_at: string
}

export interface AlertHistory {
  id: number
  alert: number
  field: string
  old_value: string
  new_value: string
  changed_at: string
  changed_by: number | null
  changed_by_name: string
}

export interface Alert {
  id: number
  code: string
  title: string
  content: string
  source: string
  source_display: string
  level: string
  level_display: string
  status: string
  status_display: string
  server: number | null
  server_name: string
  server_ip: string
  change_window: number | null
  change_window_name: string
  category: number | null
  category_name: string
  metric: string
  metric_value: string
  threshold: string
  occurred_at: string
  acknowledged_at: string
  acknowledged_by: number | null
  acknowledged_by_name: string
  processed_at: string
  processed_by: number | null
  processed_by_name: string
  closed_at: string
  closed_by: number | null
  closed_by_name: string
  handler: number | null
  handler_name: string
  solution: string
  root_cause: string
  review_summary: string
  records?: AlertRecord[]
  attachments?: AlertAttachment[]
  histories?: AlertHistory[]
  created_at: string
}

export const alertApi = {
  list: (params?: any) =>
    request.get<any, PaginatedResponse<Alert>>('/alerts/alerts/', { params }),

  detail: (id: number) =>
    request.get<any, Alert>(`/alerts/alerts/${id}/`),

  create: (data: any) =>
    request.post('/alerts/alerts/', data),

  update: (id: number, data: any) =>
    request.put(`/alerts/alerts/${id}/`, data),

  acknowledge: (id: number, data?: any) =>
    request.post(`/alerts/alerts/${id}/acknowledge/`, data || {}),

  startProcess: (id: number, data?: any) =>
    request.post(`/alerts/alerts/${id}/start_process/`, data || {}),

  close: (id: number, data?: any) =>
    request.post(`/alerts/alerts/${id}/close/`, data || {}),

  addComment: (id: number, data: any) =>
    request.post(`/alerts/alerts/${id}/add_comment/`, data),

  uploadAttachment: (id: number, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return request.post(`/alerts/alerts/${id}/upload_attachment/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  records: (params?: any) =>
    request.get<any, PaginatedResponse<AlertRecord>>('/alerts/records/', { params }),

  attachments: (params?: any) =>
    request.get<any, PaginatedResponse<AlertAttachment>>('/alerts/attachments/', { params }),
}
