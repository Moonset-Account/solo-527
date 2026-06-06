import request from '@/utils/request'

export const getDashboardOverview = (params?: any) => {
  return request.get('/dashboard/overview', { params })
}

export const getStatusStats = (params?: any) => {
  return request.get('/dashboard/status_stats', { params })
}

export const getResourceUtilization = (params?: any) => {
  return request.get('/dashboard/resource_utilization', { params })
}

export const getEnrollmentTrends = (params?: any) => {
  return request.get('/dashboard/enrollment_trends', { params })
}
