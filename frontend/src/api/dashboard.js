import request from '@/utils/request'

export const getDashboardStats = () => {
  return request.get('/dashboard/stats')
}

export const getAnomalies = () => {
  return request.get('/dashboard/anomalies')
}
