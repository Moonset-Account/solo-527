import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const orderApi = {
  list: (params?: any) => api.get('/orders', { params }),
  detail: (id: number) => api.get(`/orders/${id}`),
  create: (data: any) => api.post('/orders', data),
  updateStatus: (id: number, data: any) => api.put(`/orders/${id}/status`, data),
  assign: (id: number, data: any) => api.put(`/orders/${id}/assign`, data),
  statistics: (params?: any) => api.get('/orders/statistics/summary', { params }),
};

export const refundApi = {
  list: (params?: any) => api.get('/refunds', { params }),
  detail: (id: number) => api.get(`/refunds/${id}`),
  create: (data: any) => api.post('/refunds', data),
  handle: (id: number, data: any) => api.put(`/refunds/${id}/handle`, data),
};

export const technicianApi = {
  list: (params?: any) => api.get('/technicians', { params }),
  loads: (params?: any) => api.get('/technicians/loads', { params }),
  detail: (id: number, params?: any) => api.get(`/technicians/${id}/detail`, { params }),
  create: (data: any) => api.post('/technicians', data),
  update: (id: number, data: any) => api.put(`/technicians/${id}`, data),
  managers: (params?: any) => api.get('/technicians/managers/list', { params }),
};

export const reviewApi = {
  list: (params?: any) => api.get('/reviews', { params }),
  badReviews: (params?: any) => api.get('/reviews/bad-reviews', { params }),
  followUp: (id: number, data: any) => api.put(`/reviews/${id}/follow-up`, data),
  create: (data: any) => api.post('/reviews', data),
};

export const rescheduleApi = {
  list: (params?: any) => api.get('/reschedule', { params }),
  reschedule: (data: any) => api.post('/reschedule/reschedule', data),
  cancel: (data: any) => api.post('/reschedule/cancel', data),
};

export const analyticsApi = {
  onTimeByDate: (params?: any) => api.get('/analytics/on-time-rate/by-date', { params }),
  onTimeByManager: (params?: any) => api.get('/analytics/on-time-rate/by-city-manager', { params }),
  delayReasons: (params?: any) => api.get('/analytics/delay-reasons', { params }),
  supplyDemandGap: (params?: any) => api.get('/analytics/supply-demand-gap', { params }),
  workloadByTech: (params?: any) => api.get('/analytics/workload/by-technician', { params }),
  overview: (params?: any) => api.get('/analytics/overview', { params }),
};

export default api;
