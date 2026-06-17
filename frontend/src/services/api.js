import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => {
    if (response.data.code === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return response.data
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  getUsers: () => api.get('/auth/users'),
  createUser: (data) => api.post('/auth/users', data),
  updateUser: (id, data) => api.put(`/auth/users/${id}`, data),
  deleteUser: (id) => api.delete(`/auth/users/${id}`),
}

export const equipmentApi = {
  getList: (params) => api.get('/equipments', { params }),
  getDetail: (id) => api.get(`/equipments/${id}`),
  getByQRCode: (qrCode) => api.get(`/equipments/qrcode/${qrCode}`),
  create: (data) => api.post('/equipments', data),
  update: (id, data) => api.put(`/equipments/${id}`, data),
  delete: (id) => api.delete(`/equipments/${id}`),
}

export const processApi = {
  getList: () => api.get('/processes'),
  getDetail: (id) => api.get(`/processes/${id}`),
  create: (data) => api.post('/processes', data),
  update: (id, data) => api.put(`/processes/${id}`, data),
  delete: (id) => api.delete(`/processes/${id}`),
}

export const workOrderApi = {
  getList: (params) => api.get('/workorders', { params }),
  getDetail: (id) => api.get(`/workorders/${id}`),
  create: (data) => api.post('/workorders', data),
  update: (id, data) => api.put(`/workorders/${id}`, data),
  delete: (id) => api.delete(`/workorders/${id}`),
}

export const planApi = {
  getList: (params) => api.get('/plans', { params }),
  getDetail: (id) => api.get(`/plans/${id}`),
  create: (data) => api.post('/plans', data),
  update: (id, data) => api.put(`/plans/${id}`, data),
  confirm: (id) => api.post(`/plans/${id}/confirm`),
  start: (id) => api.post(`/plans/${id}/start`),
  complete: (id) => api.post(`/plans/${id}/complete`),
  delete: (id) => api.delete(`/plans/${id}`),
}

export const processFlowApi = {
  getList: (params) => api.get('/processflows', { params }),
  scan: (data) => api.post('/processflows/scan', data),
  update: (id, data) => api.put(`/processflows/${id}`, data),
}

export const utilizationApi = {
  getList: (params) => api.get('/utilizations', { params }),
  getSummary: (params) => api.get('/utilizations/summary', { params }),
  create: (data) => api.post('/utilizations', data),
}

export const reworkApi = {
  getList: (params) => api.get('/reworks', { params }),
  create: (data) => api.post('/reworks', data),
  handle: (id, data) => api.post(`/reworks/${id}/handle`, data),
}

export const materialApi = {
  getList: (params) => api.get('/materials', { params }),
  create: (data) => api.post('/materials', data),
  update: (id, data) => api.put(`/materials/${id}`, data),
}

export const notificationTypes = ['REWORK', 'WORK_ORDER', 'MATERIAL', 'PLAN_CHANGE', 'SYSTEM']

export const notificationApi = {
  getList: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread/count'),
  markAsRead: (id) => api.post(`/notifications/${id}/read`),
  markAllAsRead: () => api.post('/notifications/read-all'),
  createSystem: (data) => api.post('/notifications/system', data),
}

export const logApi = {
  getList: (params) => api.get('/logs', { params }),
  getDetail: (id) => api.get(`/logs/${id}`),
}

export const importApi = {
  importEquipment: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/import/equipment', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  importWorkOrder: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/import/workorder', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  getBatches: (params) => api.get('/import/batches', { params }),
}

export default api
