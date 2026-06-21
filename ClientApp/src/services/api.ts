import axios from 'axios';
import type { ApiResponse } from '../types';

const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

request.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || '请求失败，请稍后重试';
    return Promise.reject(new Error(message));
  }
);

export const api = {
  async get<T>(url: string, params?: any): Promise<ApiResponse<T>> {
    const res = await request.get<ApiResponse<T>>(url, { params });
    return res.data;
  },

  async post<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    const res = await request.post<ApiResponse<T>>(url, data);
    return res.data;
  },

  async put<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    const res = await request.put<ApiResponse<T>>(url, data);
    return res.data;
  },

  async delete<T>(url: string): Promise<ApiResponse<T>> {
    const res = await request.delete<ApiResponse<T>>(url);
    return res.data;
  },
};

export const appointmentApi = {
  getById: (id: number) => api.get(`/appointments/${id}`),
  getByNo: (no: string) => api.get(`/appointments/no/${no}`),
  getByClient: (clientId: number) => api.get(`/appointments/client/${clientId}`),
  getByCounselor: (counselorId: number, date?: string) =>
    api.get(`/appointments/counselor/${counselorId}`, { date }),
  getList: (params?: any) => api.get('/appointments/list', params),
  create: (data: any) => api.post('/appointments', data),
  update: (id: number, data: any) => api.put(`/appointments/${id}`, data),
  cancel: (id: number, reason?: string) => api.post(`/appointments/${id}/cancel`, reason),
  checkAvailability: (params: any) => api.get('/appointments/check-availability', params),
};

export const checkInApi = {
  checkIn: (data: any) => api.post('/checkin', data),
  getById: (id: number) => api.get(`/checkin/${id}`),
  getByAppointment: (appointmentId: number) => api.get(`/checkin/appointment/${appointmentId}`),
  getByDate: (date?: string) => api.get('/checkin/by-date', { date }),
  confirm: (id: number, data: any) => api.post(`/checkin/${id}/confirm`, data),
  markNoShow: (data: any) => api.post('/checkin/no-show', data),
  getNoShowById: (id: number) => api.get(`/checkin/no-show/${id}`),
  waiveNoShow: (id: number, data: any) => api.post(`/checkin/no-show/${id}/waive`, data),
  getNoShowsByClient: (clientId: number) => api.get(`/checkin/no-show/client/${clientId}`),
};

export const serviceItemApi = {
  getAll: () => api.get('/serviceitems'),
  getActive: () => api.get('/serviceitems/active'),
  getById: (id: number) => api.get(`/serviceitems/${id}`),
  create: (data: any) => api.post('/serviceitems', data),
  update: (id: number, data: any) => api.put(`/serviceitems/${id}`, data),
  delete: (id: number) => api.delete(`/serviceitems/${id}`),
  getByPrivacyLevel: (level: number) => api.get(`/serviceitems/privacy/${level}`),
};

export const userApi = {
  getAll: () => api.get('/users'),
  getById: (id: number) => api.get(`/users/${id}`),
  getByUsername: (username: string) => api.get(`/users/username/${username}`),
  getByRole: (role: number) => api.get(`/users/role/${role}`),
  create: (data: any) => api.post('/users', data),
  update: (id: number, data: any) => api.put(`/users/${id}`, data),
  delete: (id: number) => api.delete(`/users/${id}`),
  validatePassword: (data: any) => api.post('/users/validate-password', data),
};

export const counselorApi = {
  getAll: () => api.get('/counselors'),
  getById: (id: number) => api.get(`/counselors/${id}`),
  getByServiceItem: (serviceItemId: number) => api.get(`/counselors/service/${serviceItemId}`),
  getAvailable: (params: any) => api.get('/counselors/available', params),
  create: (data: any) => api.post('/counselors', data),
  update: (id: number, data: any) => api.put(`/counselors/${id}`, data),
  delete: (id: number) => api.delete(`/counselors/${id}`),
};

export const waitlistApi = {
  getByService: (serviceItemId: number) => api.get('/waitlist', { serviceItemId }),
  getByDate: (date?: string) => api.get('/waitlist/date', { date }),
  getByClient: (clientId: number) => api.get(`/waitlist/client/${clientId}`),
  getById: (id: number) => api.get(`/waitlist/${id}`),
  create: (data: any) => api.post('/waitlist', data),
  markNotified: (id: number) => api.post(`/waitlist/${id}/notify`),
  deactivate: (id: number) => api.post(`/waitlist/${id}/deactivate`),
};

export const refundApi = {
  getList: (status?: number) => api.get('/refunds', { status }),
  getById: (id: number) => api.get(`/refunds/${id}`),
  getByAppointment: (appointmentId: number) => api.get(`/refunds/appointment/${appointmentId}`),
  create: (data: any) => api.post('/refunds', data),
  process: (id: number, data: any) => api.post(`/refunds/${id}/process`, data),
  complete: (id: number, transactionId: string) => api.post(`/refunds/${id}/complete`, transactionId),
  getByDateRange: (startDate: string, endDate: string) =>
    api.get('/refunds/date-range', { startDate, endDate }),
};

export const reminderApi = {
  getByUser: (userId: number, onlyUnread = false) =>
    api.get(`/reminders/user/${userId}`, { onlyUnread }),
  getUnreadCount: (userId: number) => api.get(`/reminders/user/${userId}/unread-count`),
  getById: (id: number) => api.get(`/reminders/${id}`),
  markAsRead: (id: number) => api.post(`/reminders/${id}/read`),
  markAllAsRead: (userId: number) => api.post(`/reminders/user/${userId}/read-all`),
  sendPending: () => api.post('/reminders/send-pending'),
};

export const storeClosureApi = {
  getList: (startDate?: string, endDate?: string) =>
    api.get('/storeclosures', { startDate, endDate }),
  getActive: (date?: string) => api.get('/storeclosures/active', { date }),
  getById: (id: number) => api.get(`/storeclosures/${id}`),
  isClosed: (date: string, time: string) =>
    api.get('/storeclosures/check-closed', { date, time }),
  create: (data: any) => api.post('/storeclosures', data),
  delete: (id: number) => api.delete(`/storeclosures/${id}`),
};

export const statisticsApi = {
  getDaily: (date?: string) => api.get('/statistics/daily', { date }),
  getByDateRange: (startDate: string, endDate: string) =>
    api.get('/statistics/range', { startDate, endDate }),
  getAttendanceRate: (startDate: string, endDate: string) =>
    api.get('/statistics/attendance-rate', { startDate, endDate }),
  getCrossDepartmentReport: (startDate: string, endDate: string) =>
    api.get('/statistics/cross-department', { startDate, endDate }),
};
