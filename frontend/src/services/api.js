import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  getCurrentUser: () => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data),
  listUsers: () => api.get('/auth/users'),
  createUser: (data) => api.post('/auth/users', data),
  updateUser: (id, data) => api.put(`/auth/users/${id}`, data),
};

export const filmsAPI = {
  list: (params) => api.get('/films', { params }),
  get: (id) => api.get(`/films/${id}`),
  create: (data) => api.post('/films', data),
  update: (id, data) => api.put(`/films/${id}`, data),
  delete: (id) => api.delete(`/films/${id}`),
  checkLicense: (id, date) => api.get(`/films/check-license/${id}`, { params: { date } }),
};

export const hallsAPI = {
  list: (params) => api.get('/halls', { params }),
  get: (id) => api.get(`/halls/${id}`),
  create: (data) => api.post('/halls', data),
  update: (id, data) => api.put(`/halls/${id}`, data),
  delete: (id) => api.delete(`/halls/${id}`),
  checkAvailability: (id, date) => api.get(`/halls/${id}/availability`, { params: { date } }),
};

export const membersAPI = {
  listLevels: () => api.get('/members/levels'),
  createLevel: (data) => api.post('/members/levels', data),
  updateLevel: (id, data) => api.put(`/members/levels/${id}`, data),
  list: (params) => api.get('/members', { params }),
  get: (id) => api.get(`/members/${id}`),
  create: (data) => api.post('/members', data),
  update: (id, data) => api.put(`/members/${id}`, data),
  delete: (id) => api.delete(`/members/${id}`),
  search: (q) => api.get('/members/search', { params: { q } }),
  getBookings: (id, status) => api.get(`/bookings/member/${id}`, { params: { status } }),
};

export const screeningsAPI = {
  list: (params) => api.get('/screenings', { params }),
  calendar: (start_date, end_date) => api.get('/screenings/calendar', { params: { start_date, end_date } }),
  get: (id) => api.get(`/screenings/${id}`),
  create: (data) => api.post('/screenings', data),
  update: (id, data) => api.put(`/screenings/${id}`, data),
  delete: (id) => api.delete(`/screenings/${id}`),
  confirm: (id) => api.post(`/screenings/${id}/confirm`),
  cancel: (id) => api.post(`/screenings/${id}/cancel`),
  complete: (id) => api.post(`/screenings/${id}/complete`),
};

export const bookingsAPI = {
  list: (params) => api.get('/bookings', { params }),
  get: (id) => api.get(`/bookings/${id}`),
  create: (data) => api.post('/bookings', data),
  confirm: (id) => api.post(`/bookings/${id}/confirm`),
  cancel: (id, reason) => api.post(`/bookings/${id}/cancel`, { reason }),
  checkIn: (id, notes) => api.post(`/bookings/${id}/check-in`, { notes }),
  getByBookingNo: (bookingNo) => api.get(`/bookings/by-booking-no/${bookingNo}`),
  getWaitlist: (screeningId) => api.get(`/bookings/screening/${screeningId}/waitlist`),
  processWaitlist: (screeningId) => api.post(`/bookings/screening/${screeningId}/process-waitlist`),
};

export const guestsAPI = {
  list: (params) => api.get('/guests', { params }),
  get: (id) => api.get(`/guests/${id}`),
  create: (data) => api.post('/guests', data),
  update: (id, data) => api.put(`/guests/${id}`, data),
  delete: (id) => api.delete(`/guests/${id}`),
  confirm: (id) => api.post(`/guests/${id}/confirm`),
  decline: (id) => api.post(`/guests/${id}/decline`),
  checkIn: (id, notes) => api.post(`/guests/${id}/check-in`, { notes }),
  sendInvitation: (id) => api.post(`/guests/send-invitation/${id}`),
};

export const reportsAPI = {
  dashboard: () => api.get('/reports/dashboard'),
  screeningsStats: (start_date, end_date) => api.get('/reports/screenings/stats', { params: { start_date, end_date } }),
  membersStats: () => api.get('/reports/members/stats'),
  listReconciliations: () => api.get('/reports/reconciliation'),
  generateReconciliation: (month) => api.post('/reports/reconciliation/generate', { month }),
  confirmReconciliation: (id) => api.post(`/reports/reconciliation/${id}/confirm`),
};

export const ieAPI = {
  listTasks: () => api.get('/ie/tasks'),
  export: (entityType) => api.get(`/ie/export/${entityType}`, { responseType: 'blob' }),
  import: (entityType, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/ie/import/${entityType}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const logsAPI = {
  listErrors: (params) => api.get('/logs/errors', { params }),
  getError: (id) => api.get(`/logs/errors/${id}`),
  clearErrors: (days) => api.delete('/logs/errors', { params: { days } }),
  listNotifications: (params) => api.get('/logs/notifications', { params }),
  retryNotification: (id) => api.post(`/logs/notifications/${id}/retry`),
};

export default api;
