import request from './request'

export interface Report {
  _id: string
  activityId: string
  reporterId: string
  reporterName: string
  targetId: string
  targetName: string
  reason: string
  status: 'pending' | 'reviewing' | 'resolved' | 'rejected'
  resolvedBy?: string
  resolvedAt?: string
  createdAt: string
  updatedAt: string
}

export interface ReportListParams {
  activityId?: string
  status?: string
  reporterId?: string
  page?: number
  limit?: number
}

export interface CreateReportData {
  activityId: string
  reporterId: string
  reporterName: string
  targetId: string
  targetName: string
  reason: string
}

export interface UpdateReportData {
  status?: string
  resolvedBy?: string
}

export const getReports = (params?: ReportListParams) => {
  return request.get('/reports', { params })
}

export const createReport = (data: CreateReportData) => {
  return request.post('/reports', data)
}

export const updateReport = (id: string, data: UpdateReportData) => {
  return request.patch(`/reports/${id}`, data)
}
