import request, { PaginatedResponse } from './index'

export interface InspectionTemplate {
  id: number
  name: string
  code: string
  template_type: string
  template_type_display: string
  description: string
  cron_expression: string
  timeout_seconds: number
  is_enabled: boolean
  is_active: boolean
  items_count: number
  item_count: number
  task_count: number
  created_by_name: string
  created_at: string
}

export interface InspectionItem {
  id: number
  template: number
  name: string
  item_type: string
  item_type_display: string
  metric: string
  operator: string
  operator_display: string
  threshold: string
  warning_value: string
  critical_value: string
  description: string
  sort_order: number
  created_at: string
}

export interface InspectionResult {
  id: number
  task: number
  item: number
  item_name: string
  server: number
  server_name: string
  server_ip: string
  status: string
  status_display: string
  actual_value: string
  expected_value: string
  message: string
  checked_at: string
}

export interface InspectionTask {
  id: number
  code: string
  name: string
  template: number
  template_name: string
  status: string
  status_display: string
  trigger_type: string
  trigger_type_display: string
  started_at: string
  finished_at: string
  total_count: number
  success_count: number
  warning_count: number
  critical_count: number
  failed_count: number
  timeout_count: number
  duration_seconds: number
  triggered_by: number | null
  triggered_by_name: string
  executed_by_name: string
  result_summary: string
  results?: InspectionResult[]
  created_at: string
}

export const inspectionApi = {
  templateList: (params?: any) =>
    request.get<any, PaginatedResponse<InspectionTemplate>>('/inspections/templates/', { params }),

  templates: (params?: any) =>
    request.get<any, PaginatedResponse<InspectionTemplate>>('/inspections/templates/', { params }),

  templateDetail: (id: number) =>
    request.get<any, any>(`/inspections/templates/${id}/`),

  templateCreate: (data: any) =>
    request.post('/inspections/templates/', data),

  templateUpdate: (id: number, data: any) =>
    request.put(`/inspections/templates/${id}/`, data),

  templateDelete: (id: number) =>
    request.delete(`/inspections/templates/${id}/`),

  deleteTemplate: (id: number) =>
    request.delete(`/inspections/templates/${id}/`),

  templateRun: (id: number) =>
    request.post(`/inspections/templates/${id}/run/`),

  runTemplate: (id: number) =>
    request.post(`/inspections/templates/${id}/run/`),

  itemList: (params?: any) =>
    request.get<any, PaginatedResponse<InspectionItem>>('/inspections/items/', { params }),

  itemCreate: (data: any) =>
    request.post('/inspections/items/', data),

  itemUpdate: (id: number, data: any) =>
    request.put(`/inspections/items/${id}/`, data),

  itemDelete: (id: number) =>
    request.delete(`/inspections/items/${id}/`),

  taskList: (params?: any) =>
    request.get<any, PaginatedResponse<InspectionTask>>('/inspections/tasks/', { params }),

  tasks: (params?: any) =>
    request.get<any, PaginatedResponse<InspectionTask>>('/inspections/tasks/', { params }),

  taskDetail: (id: number) =>
    request.get<any, InspectionTask>(`/inspections/tasks/${id}/`),

  taskRerun: (id: number) =>
    request.post(`/inspections/tasks/${id}/rerun/`),

  rerunTask: (id: number) =>
    request.post(`/inspections/tasks/${id}/rerun/`),

  resultList: (params?: any) =>
    request.get<any, PaginatedResponse<InspectionResult>>('/inspections/results/', { params }),
}
