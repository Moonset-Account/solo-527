import axios from 'axios'
import { message } from 'antd'

const request = axios.create({
  baseURL: '/api/v1',
  timeout: 60000,
})

request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      const { status, data } = error.response
      if (status === 401) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('user_info')
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login'
        }
        message.error('登录已过期，请重新登录')
      } else if (status === 403) {
        message.error('权限不足')
      } else if (status === 400) {
        message.error(data?.detail || '请求错误')
      } else if (status >= 500) {
        message.error('服务器错误')
      }
    } else if (error.message?.includes('timeout')) {
      message.error('网络超时')
    } else {
      message.error('网络连接失败')
    }
    return Promise.reject(error)
  }
)

export const api = {
  auth: {
    login: (formData) => request.post('/auth/login', null, { params: formData }),
    register: (data) => request.post('/auth/register', data),
    getMe: () => request.get('/auth/me'),
    listUsers: (params) => request.get('/auth/users', { params }),
    createUser: (data) => request.post('/auth/users', data),
    updateUser: (id, data) => request.put(`/auth/users/${id}`, data),
  },

  departments: {
    list: (params) => request.get('/data/departments', { params }),
    create: (data) => request.post('/data/departments', data),
    update: (id, data) => request.put(`/data/departments/${id}`, data),
    import: (file) => {
      const formData = new FormData()
      formData.append('file', file)
      return request.post('/data/departments/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
  },

  appointments: {
    list: (params) => request.get('/data/appointments', { params }),
    get: (id) => request.get(`/data/appointments/${id}`),
    create: (data) => request.post('/data/appointments', data),
    update: (id, data) => request.put(`/data/appointments/${id}`, data),
    import: (file) => {
      const formData = new FormData()
      formData.append('file', file)
      return request.post('/data/appointments/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
  },

  timeSlots: {
    import: (file) => {
      const formData = new FormData()
      formData.append('file', file)
      return request.post('/data/time-slots/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    create: (data) => request.post('/data/time-slots', data),
  },

  models: {
    train: (data) => request.post('/models/train', data),
    versions: () => request.get('/models/versions'),
    activate: (id) => request.post(`/models/versions/${id}/activate`),
    rollback: (data) => request.post('/models/versions/rollback', data),
    review: (id, params) => request.post(`/models/versions/${id}/review`, params),
    score: (data) => request.post('/models/score', data || {}),
    scores: (params) => request.get('/models/scores', { params }),
    scoreDetail: (id) => request.get(`/models/scores/${id}`),
    override: (id, params) => request.put(`/models/scores/${id}/override`, params),
    feedbackHistory: (riskScoreId, apptId) => request.get('/feedback', { params: { risk_score_id: riskScoreId, appointment_id: apptId } }),
  },

  sms: {
    templates: (params) => request.get('/sms/templates', { params }),
    createTemplate: (data) => request.post('/sms/templates', data),
    updateTemplate: (id, data) => request.put(`/sms/templates/${id}`, data),
    send: (data) => request.post('/sms/send', data),
    autoSend: (params) => request.post('/sms/auto-send', null, { params }),
  },

  callbacks: {
    generate: (data) => request.post('/callbacks/generate', data),
    list: (params) => request.get('/callbacks', { params }),
    update: (id, data) => request.put(`/callbacks/${id}`, data),
  },

  feedback: {
    create: (data) => request.post('/feedback', data),
    batchCreate: (data) => request.post('/feedback/batch', data),
    batchConfirm: (ids, comment) => request.post('/feedback/confirm', { ids, feedback_ids: ids, comment }),
    list: (params) => request.get('/feedback', { params }),
    update: (id, data) => request.put(`/feedback/${id}`, data),
    errorSamples: (params) => request.get('/feedback/error-samples', { params }),
    errorStats: () => request.get('/feedback/error-statistics'),
  },

  dashboard: {
    get: (days) => request.get('/dashboard', { params: { days } }),
  },
}

export default request
