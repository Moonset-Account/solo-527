import request from '@/utils/request'

export const authApi = {
  login: (data) => request.post('/auth/login', data),
  logout: () => request.post('/auth/logout'),
  me: () => request.get('/auth/me')
}

export const dashboardApi = {
  stats: () => request.get('/dashboard/stats'),
  recentActivities: () => request.get('/dashboard/recent_activities')
}

export const peopleApi = {
  list: (params) => request.get('/people', { params }),
  detail: (id) => request.get(`/people/${id}`),
  create: (data) => request.post('/people', data),
  update: (id, data) => request.put(`/people/${id}`, data),
  blacklist: (id, reason) => request.post(`/people/${id}/blacklist`, { reason }),
  removeBlacklist: (id) => request.post(`/people/${id}/remove_blacklist`)
}

export const credentialsApi = {
  list: (params) => request.get('/credentials', { params }),
  detail: (id) => request.get(`/credentials/${id}`),
  create: (data) => request.post('/credentials', data),
  update: (id, data) => request.put(`/credentials/${id}`, data),
  verify: (id) => request.post(`/credentials/${id}/verify`)
}

export const vehiclesApi = {
  list: (params) => request.get('/vehicles', { params }),
  detail: (id) => request.get(`/vehicles/${id}`),
  create: (data) => request.post('/vehicles', data),
  update: (id, data) => request.put(`/vehicles/${id}`, data),
  blacklist: (id, reason) => request.post(`/vehicles/${id}/blacklist`, { reason })
}

export const workZonesApi = {
  list: (params) => request.get('/work_zones', { params }),
  detail: (id) => request.get(`/work_zones/${id}`),
  create: (data) => request.post('/work_zones', data),
  update: (id, data) => request.put(`/work_zones/${id}`, data)
}

export const passesApi = {
  list: (params) => request.get('/passes', { params }),
  detail: (id) => request.get(`/passes/${id}`),
  create: (data) => request.post('/passes', data),
  update: (id, data) => request.put(`/passes/${id}`, data),
  freeze: (id, reason) => request.post(`/passes/${id}/freeze`, { reason }),
  unfreeze: (id) => request.post(`/passes/${id}/unfreeze`),
  validatePassNumber: (passNumber) => request.post('/passes/validate_pass_number', { pass_number: passNumber })
}

export const approvalsApi = {
  list: (params) => request.get('/approvals', { params }),
  pendingForMe: (params) => request.get('/approvals/pending_for_me', { params }),
  approve: (id, comment) => request.post(`/approvals/${id}/approve`, { comment }),
  reject: (id, comment) => request.post(`/approvals/${id}/reject`, { comment })
}

export const violationsApi = {
  list: (params) => request.get('/violations', { params }),
  detail: (id) => request.get(`/violations/${id}`),
  create: (data) => request.post('/violations', data),
  update: (id, data) => request.put(`/violations/${id}`, data),
  monthlyStats: (month) => request.get('/violations/monthly_stats', { params: { month } })
}

export const gateLogsApi = {
  list: (params) => request.get('/gate_logs', { params }),
  create: (data) => request.post('/gate_logs', data),
  verifyAndLog: (data) => request.post('/gate_logs/verify_and_log', data),
  todayStats: (gateName) => request.get('/gate_logs/today_stats', { params: { gate_name: gateName } })
}

export const notificationsApi = {
  list: (params) => request.get('/notifications', { params }),
  unreadCount: () => request.get('/notifications/unread_count'),
  markAsRead: (id) => request.post(`/notifications/${id}/mark_as_read`),
  markAllAsRead: () => request.post('/notifications/mark_all_as_read')
}

export const importExportApi = {
  list: (params) => request.get('/import_export_jobs', { params }),
  detail: (id) => request.get(`/import_export_jobs/${id}`),
  createExport: (data) => request.post('/import_export_jobs/create_export', data),
  createImport: (data) => request.post('/import_export_jobs/create_import', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  download: (id) => request.get(`/import_export_jobs/${id}/download`, { responseType: 'blob' })
}
