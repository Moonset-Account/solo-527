import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000
});

export const alertApi = {
  query: (params) => api.post('/alerts/query', params),
  getById: (id) => api.get(`/alerts/${id}`),
  assign: (params) => api.post('/alerts/assign', params),
  handle: (params) => api.post('/alerts/handle', params),
  getHandlings: (id) => api.get(`/alerts/${id}/handlings`),
  getStats: () => api.get('/alerts/stats'),
  getAbnormal: (params) => api.post('/alerts/abnormal', params)
};

export const energyApi = {
  getCurve: (params) => api.post('/energy/curve', params),
  getPeaks: (params) => api.post('/energy/peaks', params),
  validate: (params) => api.post('/energy/validate', params),
  validateDetail: (params) => api.post('/energy/validate/detail', params),
  exportPeaks: (params) => api.post('/energy/export', params, { responseType: 'blob' }),
  getDashboard: () => api.get('/energy/dashboard'),
  getAreas: () => api.get('/energy/areas')
};

export const exportApi = {
  search: (params) => api.post('/exports/search', params),
  getById: (id) => api.get(`/exports/${id}`),
  download: (id) => api.get(`/exports/${id}/download`, { responseType: 'blob' })
};

export const referenceApi = {
  getPrices: (params) => api.get('/reference/prices', { params }),
  getStrategies: (activeOnly) => api.get('/reference/strategies', { params: { activeOnly } }),
  getStrategyVersions: (code) => api.get(`/reference/strategies/${code}/versions`),
  getStrategy: (code, version) => api.get(`/reference/strategies/${code}/${version}`),
  getPeakLoads: (params) => api.get('/reference/peak-loads', { params }),
  getStatistics: (params) => api.get('/reference/statistics', { params }),
  getFailedPeaks: () => api.get('/reference/failed-peaks'),
  getFailedStrategies: () => api.get('/reference/failed-strategies'),
  getResponseDurations: (params) => api.get('/reference/response-durations', { params })
};

export default api;
