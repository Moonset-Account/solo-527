import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

export const authApi = {
  login: (data: { email: string; password: string }) => api.post('/auth/login', data).then(r => r.data),
  register: (data: { email: string; password: string; fullName: string; phone?: string }) => api.post('/auth/register', data).then(r => r.data),
  getMe: () => api.get('/auth/me').then(r => r.data),
  updateMe: (data: any) => api.put('/auth/me', data).then(r => r.data),
};

export const concertApi = {
  list: (params?: any) => api.get('/concerts', { params }).then(r => r.data),
  get: (id: number) => api.get(`/concerts/${id}`).then(r => r.data),
  create: (data: any) => api.post('/concerts', data).then(r => r.data),
  update: (id: number, data: any) => api.put(`/concerts/${id}`, data).then(r => r.data),
  showList: (params?: any) => api.get('/concerts/shows/list', { params }).then(r => r.data),
  getShow: (id: number) => api.get(`/concerts/shows/${id}`).then(r => r.data),
  getSeats: (showId: number, zoneId?: number) => api.get(`/concerts/shows/${showId}/seats`, { params: { zoneId } }).then(r => r.data),
  getShowStats: (showId: number) => api.get(`/concerts/shows/${showId}/stats`).then(r => r.data),
  syncShowStats: (showId: number) => api.post(`/concerts/shows/${showId}/stats/sync`).then(r => r.data),
  addZone: (showId: number, data: any) => api.post(`/concerts/shows/${showId}/zones`, data).then(r => r.data),
};

export const orderApi = {
  list: (params?: any) => api.get('/orders', { params }).then(r => r.data),
  get: (id: number) => api.get(`/orders/${id}`).then(r => r.data),
  create: (data: any) => api.post('/orders', data).then(r => r.data),
  pay: (id: number, data?: any) => api.post(`/orders/${id}/pay`, data || {}).then(r => r.data),
  cancel: (id: number, reason?: string) => api.post(`/orders/${id}/cancel`, { reason }).then(r => r.data),
  verify: (id: number, data: { status: 'approved' | 'rejected'; note?: string }) => api.post(`/orders/${id}/verify`, data).then(r => r.data),
  verifications: (params?: any) => api.get('/orders/verifications/list', { params }).then(r => r.data),
};

export const refundApi = {
  list: (params?: any) => api.get('/refunds', { params }).then(r => r.data),
  get: (id: number) => api.get(`/refunds/${id}`).then(r => r.data),
  create: (data: any) => api.post('/refunds', data).then(r => r.data),
  review: (id: number, data: any) => api.post(`/refunds/${id}/review`, data).then(r => r.data),
  process: (id: number, data?: any) => api.post(`/refunds/${id}/process`, data || {}).then(r => r.data),
};

export const auditApi = {
  logs: (params?: any) => api.get('/audit/logs', { params }).then(r => r.data),
  logsCount: (params?: any) => api.get('/audit/logs/count', { params }).then(r => r.data),
  attachments: (params?: any) => api.get('/audit/attachments', { params }).then(r => r.data),
  addAttachment: (data: any) => api.post('/audit/attachments', data).then(r => r.data),
  deleteAttachment: (id: number) => api.delete(`/audit/attachments/${id}`).then(r => r.data),
  notes: (params?: any) => api.get('/audit/notes', { params }).then(r => r.data),
  addNote: (data: any) => api.post('/audit/notes', data).then(r => r.data),
  deleteNote: (id: number) => api.delete(`/audit/notes/${id}`).then(r => r.data),
};

export const notificationApi = {
  list: (params?: any) => api.get('/notifications', { params }).then(r => r.data),
  unreadCount: () => api.get('/notifications/unread-count').then(r => r.data),
  markRead: (id: number) => api.post(`/notifications/${id}/read`).then(r => r.data),
  readAll: () => api.post('/notifications/read-all').then(r => r.data),
  resolve: (id: number, data?: any) => api.post(`/notifications/${id}/resolve`, data || {}).then(r => r.data),
  resolveBatch: (data: any) => api.post('/notifications/batch/resolve', data).then(r => r.data),
};

export const ticketTypeApi = {
  list: (params?: any) => api.get('/ticket-types', { params }).then(r => r.data),
  get: (id: number) => api.get(`/ticket-types/${id}`).then(r => r.data),
  create: (data: any) => api.post('/ticket-types', data).then(r => r.data),
  update: (id: number, data: any) => api.put(`/ticket-types/${id}`, data).then(r => r.data),
  adjustStock: (id: number, data: any) => api.post(`/ticket-types/${id}/adjust-stock`, data).then(r => r.data),
};

export const attendanceApi = {
  list: (params?: any) => api.get('/attendance', { params }).then(r => r.data),
  stats: (params?: any) => api.get('/attendance/stats', { params }).then(r => r.data),
  scan: (data: any) => api.post('/attendance/scan', data).then(r => r.data),
  submitFeedback: (id: number, data: any) => api.post(`/attendance/${id}/feedback`, data).then(r => r.data),
};
