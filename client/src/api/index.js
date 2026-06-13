import axios from 'axios'
import { ElMessage } from 'element-plus'

const request = axios.create({
  baseURL: '/api',
  timeout: 15000
})

request.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => Promise.reject(error)
)

request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const msg = error.response?.data?.message || error.message || '请求失败'
    ElMessage.error(msg)
    return Promise.reject(error)
  }
)

export const contentApi = {
  list: (params) => request.get('/contents', { params }),
  exceptions: (params) => request.get('/contents/exceptions', { params }),
  detail: (id) => request.get(`/contents/${id}`),
  create: (data) => request.post('/contents', data),
  update: (id, data) => request.put(`/contents/${id}`, data),
  submitReview: (id, data) => request.post(`/contents/${id}/submit-review`, data),
  handleException: (id, data) => request.post(`/contents/${id}/handle-exception`, data),
  remove: (id) => request.delete(`/contents/${id}`)
}

export const reviewApi = {
  flowList: () => request.get('/review/flows'),
  activeFlows: () => request.get('/review/flows/active'),
  flowDetail: (id) => request.get(`/review/flows/${id}`),
  createFlow: (data) => request.post('/review/flows', data),
  updateFlow: (id, data) => request.put(`/review/flows/${id}`, data),
  removeFlow: (id) => request.delete(`/review/flows/${id}`),
  recordList: (params) => request.get('/review/records', { params }),
  createRecord: (data) => request.post('/review/records', data)
}

export const statsApi = {
  status: (params) => request.get('/stats/status', { params }),
  trend: (params) => request.get('/stats/trend', { params }),
  assignee: (params) => request.get('/stats/assignee', { params })
}

export const operationApi = {
  platformAccountList: (params) => request.get('/operation/platform-accounts', { params }),
  platformAccountDetail: (id) => request.get(`/operation/platform-accounts/${id}`),
  createPlatformAccount: (data) => request.post('/operation/platform-accounts', data),
  updatePlatformAccount: (id, data) => request.put(`/operation/platform-accounts/${id}`, data),
  removePlatformAccount: (id) => request.delete(`/operation/platform-accounts/${id}`),
  materialList: (params) => request.get('/operation/materials', { params }),
  materialDetail: (id) => request.get(`/operation/materials/${id}`),
  createMaterial: (data) => request.post('/operation/materials', data),
  updateMaterial: (id, data) => request.put(`/operation/materials/${id}`, data),
  removeMaterial: (id) => request.delete(`/operation/materials/${id}`),
  scheduleList: (params) => request.get('/operation/schedules', { params }),
  scheduleDetail: (id) => request.get(`/operation/schedules/${id}`),
  createSchedule: (data) => request.post('/operation/schedules', data),
  updateSchedule: (id, data) => request.put(`/operation/schedules/${id}`, data),
  removeSchedule: (id) => request.delete(`/operation/schedules/${id}`)
}

export const settingsApi = {
  dictList: (params) => request.get('/settings/dict-items', { params }),
  dictCodes: () => request.get('/settings/dict-items/codes'),
  dictByCode: (code) => request.get(`/settings/dict-items/code/${code}`),
  dictDetail: (id) => request.get(`/settings/dict-items/${id}`),
  createDict: (data) => request.post('/settings/dict-items', data),
  updateDict: (id, data) => request.put(`/settings/dict-items/${id}`, data),
  removeDict: (id) => request.delete(`/settings/dict-items/${id}`),
  configList: (params) => request.get('/settings/system-configs', { params }),
  configGroups: () => request.get('/settings/system-configs/groups'),
  configByGroup: (group) => request.get(`/settings/system-configs/group/${group}`),
  configByKey: (key) => request.get(`/settings/system-configs/key/${key}`),
  configDetail: (id) => request.get(`/settings/system-configs/${id}`),
  createConfig: (data) => request.post('/settings/system-configs', data),
  updateConfig: (id, data) => request.put(`/settings/system-configs/${id}`, data),
  removeConfig: (id) => request.delete(`/settings/system-configs/${id}`)
}

export default request
