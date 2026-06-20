
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import { message } from 'antd'

const http: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 60000,
  headers: {
    'X-Operator': localStorage.getItem('operator') || 'admin'
  }
})

http.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
)

http.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const msg = error.response?.data?.message || error.message || '请求失败'
    message.error(msg)
    return Promise.reject(error)
  }
)

export default http

export const sessions = {
  getAll: () => http.get<any, any[]>('/sessions'),
  getById: (id: string) => http.get<any, any>(`/sessions/${id}`),
  create: (data: any) => http.post<any, any>('/sessions', data),
  update: (id: string, data: any) => http.put(`/sessions/${id}`, data),
  delete: (id: string) => http.delete(`/sessions/${id}`),
  changeStatus: (id: string, status: number) => http.patch(`/sessions/${id}/status`, status)
}

export const seats = {
  getBySession: (sessionId: string) => http.get<any, any[]>(`/seats/bysession/${sessionId}`),
  getById: (id: string) => http.get<any, any>(`/seats/${id}`),
  create: (data: any) => http.post<any, any>('/seats', data),
  batchCreate: (data: any) => http.post<any, any[]>('/seats/batch', data),
  update: (id: string, data: any) => http.put(`/seats/${id}`, data),
  delete: (id: string) => http.delete(`/seats/${id}`),
  batchUpdateStatus: (data: any) => http.post('/seats/batch/status', data)
}

export const ticketStock = {
  getBySession: (sessionId: string) => http.get<any, any[]>(`/ticketstock/bysession/${sessionId}`),
  getById: (id: string) => http.get<any, any>(`/ticketstock/${id}`),
  create: (data: any) => http.post<any, any>('/ticketstock', data),
  update: (id: string, data: any) => http.put(`/ticketstock/${id}`, data),
  delete: (id: string) => http.delete(`/ticketstock/${id}`),
  refresh: (sessionId?: string) => http.post('/ticketstock/refresh', { sessionId })
}

export const registrations = {
  query: (data: any) => http.post<any, any>('/registrations/query', data),
  getById: (id: string) => http.get<any, any>(`/registrations/${id}`),
  submit: (data: any) => http.post<any, any>('/registrations/submit', data),
  create: (data: any) => http.post<any, any>('/registrations', data),
  review: (id: string, data: any) => http.post(`/registrations/${id}/review`, data),
  cancel: (id: string, comment: string) => http.post(`/registrations/${id}/cancel`, { comment }),
  audit: (id: string) => http.get<any, any[]>(`/registrations/${id}/audit`)
}

export const todos = {
  query: (page: number, pageSize: number, status?: number, priority?: number, keyword?: string) => {
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('pageSize', String(pageSize))
    if (status !== undefined) params.set('status', String(status))
    if (priority !== undefined) params.set('priority', String(priority))
    if (keyword) params.set('keyword', keyword)
    return http.get<any, any>(`/todos?${params.toString()}`)
  },
  getById: (id: string) => http.get<any, any>(`/todos/${id}`),
  create: (data: any) => http.post<any, any>('/todos', data),
  resolve: (id: string, data: any) => http.post(`/todos/${id}/resolve`, data),
  pendingCount: () => http.get<any, number>('/todos/pending/count')
}

export const logs = {
  query: (data: any) => http.post<any, any>('/logs/query', data),
  byEntity: (entityType: string, entityId: string) =>
    http.get<any, any[]>(`/logs/entity?entityType=${entityType}&entityId=${entityId}`)
}

export const apiRetry = {
  query: (data: any) => http.post<any, any>('/apiretry/query', data),
  getById: (id: string) => http.get<any, any>(`/apiretry/${id}`),
  retry: (id: string) => http.post(`/apiretry/${id}/retry`),
  pending: () => http.get<any, any[]>('/apiretry/pending'),
  export: (data: any) => axios({
    url: '/api/apiretry/export',
    method: 'POST',
    data,
    responseType: 'blob',
    timeout: 120000
  })
}

export const dashboard = {
  stats: () => http.get<any, any>('/dashboard/stats'),
  inventory: (sessionId?: string) =>
    sessionId ? http.get<any, any[]>(`/dashboard/inventory?sessionId=${sessionId}`) : http.get<any, any[]>('/dashboard/inventory')
}
