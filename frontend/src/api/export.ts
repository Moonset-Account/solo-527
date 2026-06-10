import request from './request'
import type { ApiResponse } from '@/types'

export const exportProjectData = (projectId: string) => {
  return request.get<ApiResponse<string>, ApiResponse<string>>(`/export/project/${projectId}`, {
    responseType: 'blob' as unknown as undefined
  })
}

export const exportMaterialCostReport = (params?: Record<string, unknown>) => {
  return request.get<ApiResponse<string>, ApiResponse<string>>('/export/material-cost', {
    params,
    responseType: 'blob' as unknown as undefined
  })
}

export const exportMonthlyReport = (month: string) => {
  return request.get<ApiResponse<string>, ApiResponse<string>>(`/export/monthly/${month}`, {
    responseType: 'blob' as unknown as undefined
  })
}
