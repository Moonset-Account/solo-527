import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
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
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/users/profile'),
};

export const counselorApi = {
  getPublicList: () => api.get('/counselors/public'),
  getList: (params) => api.get('/counselors', { params }),
  getDetail: (id) => api.get(`/counselors/${id}`),
  create: (data) => api.post('/counselors', data),
  update: (id, data) => api.put(`/counselors/${id}`, data),
  remove: (id) => api.delete(`/counselors/${id}`),
};

export const appointmentApi = {
  create: (data) => api.post('/appointments', data),
  getList: (params) => api.get('/appointments', { params }),
  getMyAppointments: (params) => api.get('/appointments/my', { params }),
  getDetail: (id) => api.get(`/appointments/${id}`),
  update: (id, data) => api.put(`/appointments/${id}`, data),
  confirm: (id) => api.post(`/appointments/${id}/confirm`),
  cancel: (id, data) => api.post(`/appointments/${id}/cancel`, data),
  complete: (id, data) => api.post(`/appointments/${id}/complete`, data),
  noShow: (id) => api.post(`/appointments/${id}/no-show`),
  updatePayment: (id, data) => api.post(`/appointments/${id}/payment`, data),
};

export const waitlistApi = {
  join: (data) => api.post('/waitlist/join', data),
  getList: (params) => api.get('/waitlist', { params }),
  getMyWaitlist: (params) => api.get('/waitlist/my', { params }),
  getDetail: (id) => api.get(`/waitlist/${id}`),
  getPosition: (params) => api.get('/waitlist/position', { params }),
  notify: (id) => api.post(`/waitlist/${id}/notify`),
  confirm: (id) => api.post(`/waitlist/${id}/confirm`),
  cancel: (id, data) => api.post(`/waitlist/${id}/cancel`, data),
  expire: (id) => api.post(`/waitlist/${id}/expire`),
};

export const waitlistRulesApi = {
  getList: (params) => api.get('/waitlist-rules', { params }),
  getActive: () => api.get('/waitlist-rules/active'),
  getDetail: (id) => api.get(`/waitlist-rules/${id}`),
  create: (data) => api.post('/waitlist-rules', data),
  update: (id, data) => api.put(`/waitlist-rules/${id}`, data),
  remove: (id) => api.delete(`/waitlist-rules/${id}`),
  toggle: (id) => api.post(`/waitlist-rules/${id}/toggle`),
};

export const servicesApi = {
  getList: (params) => api.get('/services', { params }),
  getByCounselor: (counselorId) => api.get(`/services/counselor/${counselorId}`),
  getDetail: (id) => api.get(`/services/${id}`),
  create: (data) => api.post('/services', data),
  update: (id, data) => api.put(`/services/${id}`, data),
  remove: (id) => api.delete(`/services/${id}`),
};

export const schedulesApi = {
  getList: (params) => api.get('/schedules', { params }),
  getAvailable: (params) => api.get('/schedules/available', { params }),
  getByCounselorAndDate: (counselorId, date) =>
    api.get(`/schedules/counselor/${counselorId}/date/${date}`),
  getDetail: (id) => api.get(`/schedules/${id}`),
  create: (data) => api.post('/schedules', data),
  batchCreate: (data) => api.post('/schedules/batch', data),
  update: (id, data) => api.put(`/schedules/${id}`, data),
  remove: (id) => api.delete(`/schedules/${id}`),
};

export const refundsApi = {
  create: (data) => api.post('/refunds', data),
  getList: (params) => api.get('/refunds', { params }),
  getMyRefunds: (params) => api.get('/refunds/my', { params }),
  getDetail: (id) => api.get(`/refunds/${id}`),
  approve: (id, data) => api.post(`/refunds/${id}/approve`, data),
  reject: (id, data) => api.post(`/refunds/${id}/reject`, data),
  complete: (id, data) => api.post(`/refunds/${id}/complete`, data),
};

export const statisticsApi = {
  getOverview: (params) => api.get('/statistics/overview', { params }),
  getProcessingRecords: (params) => api.get('/statistics/processing-records', { params }),
  getAppointmentsByCounselor: (params) =>
    api.get('/statistics/appointments-by-counselor', { params }),
  getRefundStats: (params) => api.get('/statistics/refund-stats', { params }),
  getRecentRecords: (limit) => api.get('/statistics/recent-records', { params: { limit } }),
  getWaitlistStats: () => api.get('/statistics/waitlist-stats'),
  getCrossDeptReport: (params) => api.get('/statistics/cross-dept-report', { params }),
};

export const usersApi = {
  getList: (params) => api.get('/users', { params }),
  getDetail: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  remove: (id) => api.delete(`/users/${id}`),
};

export default api;
