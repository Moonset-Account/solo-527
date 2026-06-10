import api from './index'

export const workOrderApi = {
  list: (params) => api.get('/work-orders', { params }),
  detail: (id) => api.get(`/work-orders/${id}`),
  create: (data) => api.post('/work-orders', data),
  update: (id, data) => api.put(`/work-orders/${id}`, data),
  delete: (id) => api.delete(`/work-orders/${id}`),
  updateStatus: (id, data) => api.patch(`/work-orders/${id}/status`, data),
  getMaterials: (id) => api.get(`/work-orders/${id}/materials`),
}

export const scheduleApi = {
  list: (params) => api.get('/schedules', { params }),
  calendar: (params) => api.get('/schedules/calendar', { params }),
  detail: (id) => api.get(`/schedules/${id}`),
  create: (data) => api.post('/schedules', data),
  update: (id, data) => api.put(`/schedules/${id}`, data),
  delete: (id) => api.delete(`/schedules/${id}`),
  adjust: (id, data) => api.patch(`/schedules/${id}/adjust`, data),
}

export const materialApi = {
  list: (params) => api.get('/materials', { params }),
  detail: (id) => api.get(`/materials/${id}`),
  create: (data) => api.post('/materials', data),
  update: (id, data) => api.put(`/materials/${id}`, data),
  delete: (id) => api.delete(`/materials/${id}`),
  checkReadiness: (workOrderId) => api.get(`/materials/work-order/${workOrderId}/readiness`),
  updateWorkOrderMaterial: (workOrderId, data) => api.post(`/materials/work-order/${workOrderId}/material`, data),
}

export const reworkApi = {
  list: (params) => api.get('/reworks', { params }),
  stats: (params) => api.get('/reworks/stats', { params }),
  detail: (id) => api.get(`/reworks/${id}`),
  create: (data) => api.post('/reworks', data),
  update: (id, data) => api.put(`/reworks/${id}`, data),
  delete: (id) => api.delete(`/reworks/${id}`),
}

export const productionApi = {
  list: (params) => api.get('/productions', { params }),
  summary: (params) => api.get('/productions/summary', { params }),
  workHours: (params) => api.get('/productions/work-hours', { params }),
  detail: (id) => api.get(`/productions/${id}`),
  create: (data) => api.post('/productions', data),
  update: (id, data) => api.put(`/productions/${id}`, data),
  delete: (id) => api.delete(`/productions/${id}`),
}

export const riskApi = {
  list: (params) => api.get('/risks', { params }),
  report: (params) => api.get('/risks/report', { params }),
  highRiskOrders: () => api.get('/risks/high-risk-orders'),
  detail: (id) => api.get(`/risks/${id}`),
  create: (data) => api.post('/risks', data),
  handle: (id, data) => api.post(`/risks/${id}/handle`, data),
}

export const logApi = {
  list: (params) => api.get('/logs', { params }),
  riskLogs: (params) => api.get('/logs/risk', { params }),
  detail: (id) => api.get(`/logs/${id}`),
}

export const userApi = {
  list: (params) => api.get('/users', { params }),
  userList: () => api.get('/users/list'),
  detail: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
}
