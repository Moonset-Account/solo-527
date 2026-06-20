import request from './request'

export interface Report {
  _id: string
  activityId: string
  activityTitle: string
  reporterId: string
  reporterName: string
  reason: string
  description: string
  status: 'pending' | 'resolved' | 'rejected'
  resolveNote?: string
  createdAt: string
  updatedAt: string
}

export interface ReportListParams {
  status?: string
  page?: number
  pageSize?: number
}

export const getReports = (params?: ReportListParams) => {
  return request.get('/reports', { params })
}

export const createReport = (data: Partial<Report>) => {
  return request.post('/reports', data)
}

export const updateReport = (id: string, data: Partial<Report>) => {
  return request.put(`/reports/${id}`, data)
}
