import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const authApi = {
  login: (data) => api.post('/auth/login', data)
}

export const athleteApi = {
  getList: (params) => api.get('/athletes', { params }),
  getSports: () => api.get('/sports'),
  getExercises: (params) => api.get('/exercises', { params })
}

export const trainingApi = {
  getLoadCurve: (params) => api.get('/training/load-curve', { params }),
  getRadar: (params) => api.get('/training/radar', { params }),
  getComparison: (params) => api.get('/training/comparison', { params }),
  getDetail: (id) => api.get(`/training/detail/${id}`),
  getPlans: (params) => api.get('/training-plans', { params }),
  getACWR: (params) => api.get('/acwr', { params })
}

export const recoveryApi = {
  getTrend: (params) => api.get('/recovery/trend', { params })
}

export const injuryApi = {
  getList: (params) => api.get('/injuries', { params })
}

export const metricsApi = {
  getConfig: () => api.get('/metrics-config')
}

export const exportApi = {
  downloadTraining: (params) => api.get('/export/training', { params, responseType: 'blob' })
}

export default api
