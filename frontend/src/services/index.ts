import api from './api'

export { authApi } from './auth'
export { childApi } from './children'
export { pickupApi } from './pickup'
export { notificationApi } from './notifications'
export { paymentApi } from './payments'
export { leaveApi } from './leave'

export const dashboardApi = {
  getOverview: (params?: any) =>
    api.get('/dashboard/overview/', { params }),

  getPickupTrend: (params?: any) =>
    api.get('/dashboard/pickup-trend/', { params }),

  getClassUtilization: (params?: any) =>
    api.get('/dashboard/class-utilization/', { params }),

  getStatusBreakdown: (params?: any) =>
    api.get('/dashboard/status-breakdown/', { params })
}

