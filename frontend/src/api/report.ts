import request from './request'
import type { MaterialCostReport, MonthlySummary, ProjectSummary, ApiResponse } from '@/types'

export const getMaterialCostReport = (params?: Record<string, unknown>) => {
  return request.get<ApiResponse<MaterialCostReport>, ApiResponse<MaterialCostReport>>('/reports/material-cost', { params })
}

export const getMonthlySummary = (month: string) => {
  return request.get<ApiResponse<MonthlySummary>, ApiResponse<MonthlySummary>>('/reports/monthly-summary', { params: { month } })
}

export const getProjectSummary = (projectId: number) => {
  return request.get<ApiResponse<ProjectSummary>, ApiResponse<ProjectSummary>>('/reports/project-summary', { params: { projectId } })
}
