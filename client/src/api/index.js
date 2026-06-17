import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const stores = {
  list: () => api.get('/stores'),
  get: (id) => api.get(`/stores/${id}`),
  create: (data) => api.post('/stores', data),
  update: (id, data) => api.put(`/stores/${id}`, data),
  delete: (id) => api.delete(`/stores/${id}`),
};

export const ingredients = {
  list: (params) => api.get('/ingredients', { params }),
  get: (id) => api.get(`/ingredients/${id}`),
  create: (data) => api.post('/ingredients', data),
  update: (id, data) => api.put(`/ingredients/${id}`, data),
  delete: (id) => api.delete(`/ingredients/${id}`),
};

export const inventory = {
  list: (params) => api.get('/inventory', { params }),
  create: (data) => api.post('/inventory', data),
  update: (id, data) => api.put(`/inventory/${id}`, data),
};

export const safetyStock = {
  list: (params) => api.get('/safety-stock', { params }),
  create: (data) => api.post('/safety-stock', data),
  delete: (id) => api.delete(`/safety-stock/${id}`),
};

export const batches = {
  list: (params) => api.get('/batches', { params }),
  get: (id) => api.get(`/batches/${id}`),
  create: (data) => api.post('/batches', data),
  update: (id, data) => api.put(`/batches/${id}`, data),
};

export const lossReasons = {
  list: (params) => api.get('/loss-reasons', { params }),
  create: (data) => api.post('/loss-reasons', data),
  update: (id, data) => api.put(`/loss-reasons/${id}`, data),
  delete: (id) => api.delete(`/loss-reasons/${id}`),
};

export const lossReports = {
  list: (params) => api.get('/loss-reports', { params }),
  get: (id) => api.get(`/loss-reports/${id}`),
  create: (data) => api.post('/loss-reports', data),
  update: (id, data) => api.put(`/loss-reports/${id}`, data),
  updateFollowUp: (id, data) => api.put(`/loss-reports/${id}/follow-up`, data),
};

export const approvals = {
  list: () => api.get('/approvals'),
  create: (data) => api.post('/approvals', data),
};

export const shifts = {
  list: (params) => api.get('/shifts', { params }),
  conflicts: (params) => api.get('/shifts/conflicts', { params }),
  repurchaseStats: (params) => api.get('/shifts/repurchase-stats', { params }),
  create: (data) => api.post('/shifts', data),
  update: (id, data) => api.put(`/shifts/${id}`, data),
  resolve: (id, data) => api.put(`/shifts/${id}/resolve`, data),
  delete: (id) => api.delete(`/shifts/${id}`),
};

export const inspections = {
  list: (params) => api.get('/inspections', { params }),
  get: (id) => api.get(`/inspections/${id}`),
  create: (data) => api.post('/inspections', data),
  update: (id, data) => api.put(`/inspections/${id}`, data),
  delete: (id) => api.delete(`/inspections/${id}`),
};

export const cashFlow = {
  list: (params) => api.get('/cashflow', { params }),
  summary: (params) => api.get('/cashflow/summary', { params }),
  create: (data) => api.post('/cashflow', data),
  update: (id, data) => api.put(`/cashflow/${id}`, data),
  delete: (id) => api.delete(`/cashflow/${id}`),
};

export const users = {
  list: (params) => api.get('/users', { params }),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
};

export const dashboard = {
  summary: (params) => api.get('/dashboard/summary', { params }),
};

export default api;
