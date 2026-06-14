import request from './index'

export const authApi = {
  login: (data: { email: string; password: string }) => request.post('/auth/login', data),
  register: (data: any) => request.post('/auth/register', data),
  logout: () => request.post('/auth/logout'),
  me: () => request.get('/auth/me')
}

export const userApi = {
  list: (params?: any) => request.get('/users', { params }),
  create: (data: any) => request.post('/users', data),
  update: (id: number, data: any) => request.put(`/users/${id}`, data),
  delete: (id: number) => request.delete(`/users/${id}`)
}

export const partnershipApi = {
  list: (params?: any) => request.get('/partnerships', { params }),
  create: (data: any) => request.post('/partnerships', data),
  detail: (id: number) => request.get(`/partnerships/${id}`),
  update: (id: number, data: any) => request.put(`/partnerships/${id}`, data),
  delete: (id: number) => request.delete(`/partnerships/${id}`),
  getStages: (id: number) => request.get(`/partnerships/${id}/stages`),
  addStage: (id: number, data: any) => request.post(`/partnerships/${id}/stages`, data),
  updateStage: (id: number, stageId: number, data: any) => request.put(`/partnerships/${id}/stages/${stageId}`, data)
}

export const benefitApi = {
  list: (params?: any) => request.get('/benefits', { params }),
  create: (data: any) => request.post('/benefits', data),
  detail: (id: number) => request.get(`/benefits/${id}`),
  update: (id: number, data: any) => request.put(`/benefits/${id}`, data),
  delete: (id: number) => request.delete(`/benefits/${id}`)
}

export const orderApi = {
  list: (params?: any) => request.get('/orders', { params }),
  create: (data: any) => request.post('/orders', data),
  detail: (id: number) => request.get(`/orders/${id}`),
  update: (id: number, data: any) => request.put(`/orders/${id}`, data),
  delete: (id: number) => request.delete(`/orders/${id}`),
  addNode: (id: number, data: any) => request.post(`/orders/${id}/nodes`, data),
  updateNode: (id: number, nodeId: number, data: any) => request.put(`/orders/${id}/nodes/${nodeId}`, data),
  getHistory: (id: number) => request.get(`/orders/${id}/history`),
  addComment: (id: number, data: any) => request.post(`/orders/${id}/comments`, data),
  uploadAttachment: (id: number, formData: FormData) => request.post(`/orders/${id}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getAttachments: (id: number) => request.get(`/orders/${id}/attachments`)
}

export const subscriptionApi = {
  list: (params?: any) => request.get('/subscriptions', { params }),
  create: (data: any) => request.post('/subscriptions', data),
  detail: (id: number) => request.get(`/subscriptions/${id}`),
  update: (id: number, data: any) => request.put(`/subscriptions/${id}`, data),
  delete: (id: number) => request.delete(`/subscriptions/${id}`),
  checkout: (data: any) => request.post('/subscriptions/checkout', data),
  getActivePlans: () => request.get('/subscriptions/public/active')
}

export const refundApi = {
  list: (params?: any) => request.get('/refunds', { params }),
  detail: (id: number) => request.get(`/refunds/${id}`),
  update: (id: number, data: any) => request.put(`/refunds/${id}`, data),
  process: (id: number, data: any) => request.post(`/refunds/${id}/process`, data)
}

export const dashboardApi = {
  overview: (params?: any) => request.get('/dashboard/overview', { params }),
  retention: (params?: any) => request.get('/dashboard/retention', { params }),
  warnings: (params?: any) => request.get('/dashboard/warnings', { params }),
  export: (params?: any) => request.get('/dashboard/export', { params, responseType: 'blob' })
}

export const configApi = {
  getStatusDict: (params?: any) => request.get('/configs/status-dict', { params }),
  updateStatusDict: (data: any) => request.put('/configs/status-dict', data),
  getReminderFrequency: () => request.get('/configs/reminder-freq'),
  updateReminderFrequency: (data: any) => request.put('/configs/reminder-freq', data),
  getAll: () => request.get('/configs/all')
}
