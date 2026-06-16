import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const msg = error.response?.data?.detail || error.message || '请求失败'
    return Promise.reject(new Error(msg))
  }
)

export const contractApi = {
  list: (params) => api.get('/contracts/', { params }),
  retrieve: (id) => api.get(`/contracts/${id}/`),
  create: (formData) => api.post('/contracts/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  submit: (id) => api.post(`/contracts/${id}/submit/`),
}

export const workflowApi = {
  list: (params) => api.get('/workflows/', { params }),
  retrieve: (id) => api.get(`/workflows/${id}/`),
  create: (data) => api.post('/workflows/', data),
  update: (id, data) => api.put(`/workflows/${id}/`, data),
  delete: (id) => api.delete(`/workflows/${id}/`),
}

export const reviewApi = {
  list: (params) => api.get('/reviews/', { params }),
  retrieve: (id) => api.get(`/reviews/${id}/`),
  create: (data) => api.post('/reviews/', data),
  submitOpinion: (id, data) => api.post(`/reviews/${id}/review/`, data),
  getOpinions: (id) => api.get(`/reviews/${id}/opinions/`),
}

export const stampNodeApi = {
  list: (params) => api.get('/stamp-nodes/', { params }),
  create: (data) => api.post('/stamp-nodes/', data),
  complete: (id) => api.post(`/stamp-nodes/${id}/complete/`),
}

export const evidenceChecklistApi = {
  list: (params) => api.get('/evidence-checklists/', { params }),
  create: (data) => api.post('/evidence-checklists/', data),
  collect: (id) => api.post(`/evidence-checklists/${id}/collect/`),
}

export const evidenceMaterialApi = {
  list: (params) => api.get('/evidence-materials/', { params }),
  create: (formData) => api.post('/evidence-materials/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
}

export const progressApi = {
  list: (params) => api.get('/progress-records/', { params }),
  board: () => api.get('/progress-board/'),
}

export const notificationApi = {
  list: (params) => api.get('/rejection-notifications/', { params }),
  markRead: (id) => api.post(`/rejection-notifications/${id}/mark_read/`),
}

export const statsApi = {
  efficiency: (params) => api.get('/stats/efficiency/', { params }),
}

export default api
