import request from './request'
import type { MaterialCost, MonthlySummary, ProjectSummary, ApiResponse } from '@/types'

export const getMaterialCostReport = (params?: Record<string, unknown>) => {
  return request.get<ApiResponse<MaterialCost[]>, ApiResponse<MaterialCost[]>>('/reports/material-cost', { params })
}

export const getMonthlySummary = (month: string) => {
  return request.get<ApiResponse<MonthlySummary>, ApiResponse<MonthlySummary>>('/reports/monthly-summary', { params: { month } })
}

export const getProjectSummary = (projectId: string) => {
  return request.get<ApiResponse<ProjectSummary>, ApiResponse<ProjectSummary>>('/reports/project-summary', { params: { projectId } })
}

export const getProjectSummaryList = (params?: Record<string, unknown>) => {
  return request.get<ApiResponse<ProjectSummary[]>, ApiResponse<ProjectSummary[]>>('/reports/project-summaries', { params })
}
