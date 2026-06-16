import axios from 'axios'
import { message } from 'antd'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

request.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

request.interceptors.response.use(
  (response) => {
    const data = response.data
    if (data.code === 0) {
      return data.data
    } else {
      message.error(data.message || '请求失败')
      return Promise.reject(data)
    }
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    message.error(error.response?.data?.message || '网络错误')
    return Promise.reject(error)
  }
)

export const authAPI = {
  login: (data) => request.post('/auth/login', data),
  getProfile: () => request.get('/auth/profile')
}

export const eventAPI = {
  getList: (params) => request.get('/events', { params }),
  getDetail: (id) => request.get(`/events/${id}`),
  getSeats: (id, sessionId) => request.get(`/events/${id}/seats`, { params: { sessionId } }),
  create: (data) => request.post('/events', data),
  update: (id, data) => request.put(`/events/${id}`, data)
}

export const orderAPI = {
  getList: (params) => request.get('/orders', { params }),
  getDetail: (id) => request.get(`/orders/${id}`),
  create: (data) => request.post('/orders', data),
  refund: (id, data) => request.post(`/orders/${id}/refund`, data)
}

export const checkInAPI = {
  getList: (params) => request.get('/checkins', { params }),
  doCheckIn: (orderItemId, data) => request.post(`/checkins/${orderItemId}`, data),
  getStats: (eventId) => request.get(`/checkins/stats/by-event/${eventId}`)
}

export const refundAPI = {
  getList: (params) => request.get('/refunds', { params }),
  getPendingCount: () => request.get('/refunds/pending/count'),
  approve: (id, data) => request.post(`/refunds/${id}/approve`, data),
  reject: (id, data) => request.post(`/refunds/${id}/reject`, data)
}

export const dashboardAPI = {
  getSummary: (params) => request.get('/dashboard/summary', { params }),
  getConversion: (params) => request.get('/dashboard/conversion', { params }),
  getRevenueTrend: (params) => request.get('/dashboard/revenue/trend', { params }),
  getReviewSummary: (params) => request.get('/dashboard/review/summary', { params })
}

export const todoAPI = {
  getList: (params) => request.get('/todos', { params }),
  getStats: () => request.get('/todos/stats'),
  create: (data) => request.post('/todos', data),
  update: (id, data) => request.put(`/todos/${id}`, data),
  remove: (id) => request.delete(`/todos/${id}`)
}

export const notificationAPI = {
  getList: (params) => request.get('/notifications', { params }),
  getUnreadCount: () => request.get('/notifications/unread/count'),
  readAll: () => request.post('/notifications/read-all'),
  readOne: (id) => request.post(`/notifications/${id}/read`)
}

export const filterAPI = {
  getList: (pageKey) => request.get(`/filters/${pageKey}`),
  create: (data) => request.post('/filters', data),
  update: (id, data) => request.put(`/filters/${id}`, data),
  remove: (id) => request.delete(`/filters/${id}`)
}

export const feedbackAPI = {
  getList: (params) => request.get('/feedbacks', { params }),
  create: (data) => request.post('/feedbacks', data),
  update: (id, data) => request.put(`/feedbacks/${id}`, data)
}

export const revenueAPI = {
  getLogs: (params) => request.get('/revenue/logs', { params }),
  getSummary: (eventId) => request.get(`/revenue/summary/${eventId}`)
}

export default request
