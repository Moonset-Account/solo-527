import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => apiClient.post('/auth/login', data).then(r => r.data),
  getMe: () => apiClient.get('/auth/me').then(r => r.data),
  changePassword: (data) => apiClient.post('/auth/change-password', data).then(r => r.data),
  listUsers: (role) => apiClient.get('/auth/users', { params: { role } }).then(r => r.data),
  register: (data) => apiClient.post('/auth/register', data).then(r => r.data),
};

export const contractAPI = {
  list: (params) => apiClient.get('/contracts', { params }).then(r => r.data),
  upload: (formData) => apiClient.post('/contracts/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data),
  get: (id) => apiClient.get(`/contracts/${id}`).then(r => r.data),
  getVersions: (id) => apiClient.get(`/contracts/${id}/versions`).then(r => r.data),
  newVersion: (id, formData) => apiClient.post(`/contracts/${id}/new-version`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data),
  rollback: (id, targetVersion) => apiClient.post(`/contracts/${id}/rollback`, { target_version: targetVersion }).then(r => r.data),
  approve: (id) => apiClient.post(`/contracts/${id}/approve`).then(r => r.data),
  reject: (id, reason) => apiClient.post(`/contracts/${id}/reject`, { reason }).then(r => r.data),
  getVectorIndexes: (id) => apiClient.get(`/contracts/${id}/vector-indexes`).then(r => r.data),
  rollbackIndex: (id, targetVersion) => apiClient.post(`/contracts/${id}/rollback-index`, { target_version: targetVersion }).then(r => r.data),
  semanticSearch: (data) => apiClient.post('/contracts/semantic-search', data).then(r => r.data),
  crossSearch: (data) => apiClient.post('/contracts/cross-search', data).then(r => r.data),
};

export const riskAPI = {
  getByContract: (contractId, params) => apiClient.get(`/risks/contract/${contractId}`, { params }).then(r => r.data),
  override: (id, data) => apiClient.post(`/risks/${id}/override`, data).then(r => r.data),
  approveAll: (contractId) => apiClient.post(`/risks/contract/${contractId}/approve-all`).then(r => r.data),
  rerun: (contractId, contractVersionId) => apiClient.post(`/risks/rerun/${contractId}`, { contract_version_id: contractVersionId }).then(r => r.data),
};

export const reviewQueueAPI = {
  list: (params) => apiClient.get('/review-queue', { params }).then(r => r.data),
  assignMe: (id) => apiClient.post(`/review-queue/${id}/assign-me`).then(r => r.data),
  complete: (id, data) => apiClient.post(`/review-queue/${id}/complete`, data).then(r => r.data),
  add: (data) => apiClient.post('/review-queue/add', data).then(r => r.data),
  stats: (userId) => apiClient.get('/review-queue/stats', { params: { user_id: userId } }).then(r => r.data),
  overdue: () => apiClient.get('/review-queue/overdue').then(r => r.data),
  dashboard: () => apiClient.get('/review-queue/dashboard').then(r => r.data),
};

export const auditAPI = {
  list: (params) => apiClient.get('/audit', { params }).then(r => r.data),
  contractHistory: (contractId) => apiClient.get(`/audit/contract/${contractId}`).then(r => r.data),
  actions: () => apiClient.get('/audit/actions').then(r => r.data),
};

export const alertAPI = {
  list: (params) => apiClient.get('/alerts', { params }).then(r => r.data),
  acknowledge: (id) => apiClient.post(`/alerts/${id}/acknowledge`).then(r => r.data),
  resolve: (id, notes) => apiClient.post(`/alerts/${id}/resolve`, { notes }).then(r => r.data),
  types: () => apiClient.get('/alerts/types').then(r => r.data),
  summary: () => apiClient.get('/alerts/summary').then(r => r.data),
};

export const clauseListAPI = {
  generate: (contractId, notes) => apiClient.post(`/clause-lists/generate/${contractId}`, { notes }).then(r => r.data),
  validate: (contractId) => apiClient.get(`/clause-lists/contract/${contractId}/validate`).then(r => r.data),
  get: (id) => apiClient.get(`/clause-lists/${id}`).then(r => r.data),
  list: (params) => apiClient.get('/clause-lists', { params }).then(r => r.data),
  export: (id, format) => apiClient.get(`/clause-lists/${id}/export/${format}`, { responseType: 'blob' }),
};

export default apiClient;
