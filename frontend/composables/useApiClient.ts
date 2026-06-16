export const useApiClient = () => {
  const api = useApi()

  return {
    auth: {
      login: (username: string, password: string) =>
        api.post('/auth/login', { username, password }),
      getMe: () => api.get('/auth/me'),
      changePassword: (oldPassword: string, newPassword: string) =>
        api.post('/auth/change-password', { old_password: oldPassword, new_password: newPassword }),
      register: (data: any) => api.post('/auth/register', data),
    },

    users: {
      list: (params?: any) => api.get('/users', params),
      create: (data: any) => api.post('/users', data),
      get: (id: number) => api.get(`/users/${id}`),
      update: (id: number, data: any) => api.put(`/users/${id}`, data),
      remove: (id: number) => api.delete(`/users/${id}`),
    },

    requests: {
      list: (params?: any) => api.get('/requests', params),
      create: (data: any) => api.post('/requests', data),
      get: (id: number) => api.get(`/requests/${id}`),
      update: (id: number, data: any) => api.put(`/requests/${id}`, data),
      updateChangeWindow: (id: number, data: any) =>
        api.put(`/requests/${id}/change-window`, data),
      approveChangeWindow: (id: number, data: any) =>
        api.post(`/requests/${id}/approve-change-window`, data),
      updateRollbackPlan: (id: number, data: any) =>
        api.put(`/requests/${id}/rollback-plan`, data),
      approveRollbackPlan: (id: number, data: any) =>
        api.post(`/requests/${id}/approve-rollback-plan`, data),
      submitImplementation: (id: number, data: any) =>
        api.post(`/requests/${id}/implementation`, data),
      getApprovals: (id: number) => api.get(`/requests/${id}/approvals`),
    },

    devices: {
      list: (params?: any) => api.get('/devices', params),
      create: (data: any) => api.post('/devices', data),
      get: (id: number) => api.get(`/devices/${id}`),
      update: (id: number, data: any) => api.put(`/devices/${id}`, data),
      remove: (id: number) => api.delete(`/devices/${id}`),
    },

    alerts: {
      list: (params?: any) => api.get('/alerts', params),
      create: (data: any) => api.post('/alerts', data),
      get: (id: number) => api.get(`/alerts/${id}`),
      update: (id: number, data: any) => api.put(`/alerts/${id}`, data),
      confirm: (id: number, data: any) => api.post(`/alerts/${id}/confirm`, data),
      resolve: (id: number, data: any) => api.post(`/alerts/${id}/resolve`, data),
      remove: (id: number) => api.delete(`/alerts/${id}`),
    },

    vulnerabilities: {
      list: (params?: any) => api.get('/vulnerabilities', params),
      create: (data: any) => api.post('/vulnerabilities', data),
      get: (id: number) => api.get(`/vulnerabilities/${id}`),
      update: (id: number, data: any) => api.put(`/vulnerabilities/${id}`, data),
      fix: (id: number, data: any) => api.post(`/vulnerabilities/${id}/fix`, data),
      remove: (id: number) => api.delete(`/vulnerabilities/${id}`),
    },

    logs: {
      audit: (params?: any) => api.get('/logs/audit', params),
      auditDetail: (id: number) => api.get(`/logs/audit/${id}`),
      apiErrors: (params?: any) => api.get('/logs/api-errors', params),
      apiErrorDetail: (id: number) => api.get(`/logs/api-errors/${id}`),
      resolveApiError: (id: number, data: any) =>
        api.put(`/logs/api-errors/${id}/resolve`, data),
    },
  }
}
