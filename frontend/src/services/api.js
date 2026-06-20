import axios from 'axios'
import { message } from 'antd'
import { store, setLogout } from '@/store'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

api.interceptors.request.use(
  (config) => {
    const token = store.getState().auth.token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => {
    const data = response.data
    if (data && typeof data === 'object' && 'success' in data) {
      if (!data.success) {
        message.error(data.message || '请求失败')
        return Promise.reject(new Error(data.message))
      }
      return data.data
    }
    return data
  },
  (error) => {
    if (error.response?.status === 401) {
      store.dispatch(setLogout())
      message.error('登录已过期，请重新登录')
      window.location.href = '/login'
    } else if (error.response?.status === 403) {
      message.error('没有权限访问此资源')
    } else if (error.response?.status === 500) {
      message.error('服务器内部错误')
    } else {
      message.error(error.message || '网络错误')
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
}

export const anomalyApi = {
  getList: (params) => api.get('/anomalies', { params }),
  getStats: () => api.get('/anomalies/stats'),
  getDetail: (id) => api.get(`/anomalies/${id}`),
  create: (data) => api.post('/anomalies', data),
  handle: (id) => api.put(`/anomalies/${id}/handle`),
  resolve: (id, data) => api.put(`/anomalies/${id}/resolve`, data),
}

export const alertApi = {
  getList: (params) => api.get('/alert-rules', { params }),
  getDetail: (id) => api.get(`/alert-rules/${id}`),
  create: (data) => api.post('/alert-rules', data),
  update: (id, data) => api.put(`/alert-rules/${id}`, data),
  delete: (id) => api.delete(`/alert-rules/${id}`),
  toggle: (id, enabled) => api.put(`/alert-rules/${id}/toggle`, null, { params: { enabled } }),
}

export const dimensionApi = {
  getList: (params) => api.get('/dimensions', { params }),
  getEnabled: () => api.get('/dimensions/enabled'),
  getDetail: (id) => api.get(`/dimensions/${id}`),
  create: (data) => api.post('/dimensions', data),
  update: (id, data) => api.put(`/dimensions/${id}`, data),
  delete: (id) => api.delete(`/dimensions/${id}`),
  toggle: (id, enabled) => api.put(`/dimensions/${id}/toggle`, null, { params: { enabled } }),
}

export const approvalApi = {
  getList: (params) => api.get('/approvals', { params }),
  getStats: () => api.get('/approvals/stats'),
  getDetail: (id) => api.get(`/approvals/${id}`),
  create: (data) => api.post('/approvals', data),
  approve: (id, data) => api.put(`/approvals/${id}/approve`, data),
  reject: (id, data) => api.put(`/approvals/${id}/reject`, data),
}

export const datasetApi = {
  getList: (params) => api.get('/dataset-permissions', { params }),
  getMyPermissions: () => api.get('/dataset-permissions/my'),
  getDetail: (id) => api.get(`/dataset-permissions/${id}`),
  create: (data) => api.post('/dataset-permissions', data),
  update: (id, data) => api.put(`/dataset-permissions/${id}`, data),
  delete: (id) => api.delete(`/dataset-permissions/${id}`),
  toggle: (id, enabled) => api.put(`/dataset-permissions/${id}/toggle`, null, { params: { enabled } }),
}

export const desensitizationApi = {
  getList: (params) => api.get('/desensitization', { params }),
  getDetail: (id) => api.get(`/desensitization/${id}`),
  create: (data) => api.post('/desensitization', data),
  update: (id, data) => api.put(`/desensitization/${id}`, data),
  delete: (id) => api.delete(`/desensitization/${id}`),
  apply: (datasetCode, data, userDataLevel) =>
    api.post('/desensitization/apply', data, { params: { datasetCode, userDataLevel } }),
  applyList: (datasetCode, dataList, userDataLevel) =>
    api.post('/desensitization/apply-list', dataList, { params: { datasetCode, userDataLevel } }),
}

export const delayApi = {
  getList: (params) => api.get('/data-delay', { params }),
  getStats: () => api.get('/data-delay/stats'),
  getNotifications: () => api.get('/data-delay/notifications'),
  getDetail: (id) => api.get(`/data-delay/${id}`),
  update: (id, data) => api.put(`/data-delay/${id}`, data),
  clearNotification: (index) => api.delete(`/data-delay/notifications/${index}`),
  clearAllNotifications: () => api.delete('/data-delay/notifications'),
}

export const efficiencyApi = {
  getList: (params) => api.get('/report-efficiency', { params }),
  getTrend: (params) => api.get('/report-efficiency/trend', { params }),
  getSummary: (params) => api.get('/report-efficiency/summary', { params }),
  getDashboard: (params) => api.get('/report-efficiency/dashboard', { params }),
  record: (data) => api.post('/report-efficiency', data),
}

export const filterApi = {
  getList: (params) => api.get('/filter-templates', { params }),
  getMyTemplates: (pageCode) => api.get('/filter-templates/my', { params: { pageCode } }),
  getDetail: (id) => api.get(`/filter-templates/${id}`),
  useTemplate: (id) => api.get(`/filter-templates/${id}/use`),
  create: (data) => api.post('/filter-templates', data),
  update: (id, data) => api.put(`/filter-templates/${id}`, data),
  rename: (id, templateName) => api.put(`/filter-templates/${id}/rename`, { templateName }),
  delete: (id) => api.delete(`/filter-templates/${id}`),
  share: (id, roleCodes) => api.put(`/filter-templates/${id}/share`, { roleCodes }),
}

export default api
