import api from './request';

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getCurrentUser: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  getUsers: () => api.get('/auth/users'),
  verifyUser: (id) => api.put(`/auth/users/${id}/verify`)
};

export const toolAPI = {
  getTools: (params) => api.get('/tools', { params }),
  getTool: (id) => api.get(`/tools/${id}`),
  getToolByQr: (qrCode) => api.get(`/tools/qr/${qrCode}`),
  createTool: (data) => api.post('/tools', data, { headers: { 'Content-Type': 'multipart/form-data' }),
  updateTool: (id, data) => api.put(`/tools/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteTool: (id) => api.delete(`/tools/${id}`),
  getCalendar: (params) => api.get('/tools/calendar', { params }),
  checkAvailability: (data) => api.post('/tools/check-availability', data)
};

export const borrowAPI = {
  getMyBorrows: () => api.get('/borrows/my'),
  getAllBorrows: (params) => api.get('/borrows', { params }),
  createBorrow: (data) => api.post('/borrows', data),
  approveBorrow: (id) => api.put(`/borrows/${id}/approve`),
  rejectBorrow: (id, data) => api.put(`/borrows/${id}/reject`, data),
  confirmPickup: (id) => api.put(`/borrows/${id}/pickup`),
  returnTool: (id, data) => api.put(`/borrows/${id}/return`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  payDeposit: (id) => api.put(`/borrows/${id}/pay-deposit`),
  reportDamage: (id, data) => api.put(`/borrows/${id}/report-damage`, data)
};

export const maintenanceAPI = {
  getMyMaintenances: () => api.get('/maintenances/my'),
  getAllMaintenances: (params) => api.get('/maintenances', { params }),
  createMaintenance: (data) => api.post('/maintenances', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateMaintenanceStatus: (id, data) => api.put(`/maintenances/${id}/status`, data)
};

export const notificationAPI = {
  getNotifications: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  getAuditLogs: (params) => api.get('/audit-logs', { params }),
  getStatistics: () => api.get('/statistics')
};
