const BASE_URL = '/api'

const getToken = () => localStorage.getItem('token')

const headers = (): HeadersInit => {
  const token = getToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

const handleResponse = async (response: Response) => {
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.error || '请求失败')
  }
  return data
}

export const api = {
  get: (url: string) =>
    fetch(`${BASE_URL}${url}`, { headers: headers() }).then(handleResponse),

  post: (url: string, body: any) =>
    fetch(`${BASE_URL}${url}`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body),
    }).then(handleResponse),

  put: (url: string, body: any) =>
    fetch(`${BASE_URL}${url}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(body),
    }).then(handleResponse),

  delete: (url: string) =>
    fetch(`${BASE_URL}${url}`, {
      method: 'DELETE',
      headers: headers(),
    }).then(handleResponse),
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  getMe: () => api.get('/auth/me'),
}

export const topicsApi = {
  list: (params?: Record<string, any>) =>
    api.get(
      `/topics?${new URLSearchParams(params as any).toString()}`
    ),
  get: (id: string) => api.get(`/topics/${id}`),
  create: (data: any) => api.post('/topics', data),
  update: (id: string, data: any) => api.put(`/topics/${id}`, data),
  delete: (id: string) => api.delete(`/topics/${id}`),
}

export const scriptsApi = {
  list: (params?: Record<string, any>) =>
    api.get(
      `/scripts?${new URLSearchParams(params as any).toString()}`
    ),
  get: (id: string) => api.get(`/scripts/${id}`),
  create: (data: any) => api.post('/scripts', data),
  update: (id: string, data: any) => api.put(`/scripts/${id}`, data),
  addCoverVersion: (scriptId: string, data: any) =>
    api.post(`/scripts/${scriptId}/cover-versions`, data),
}

export const materialsApi = {
  list: (params?: Record<string, any>) =>
    api.get(
      `/materials?${new URLSearchParams(params as any).toString()}`
    ),
  create: (data: any) => api.post('/materials', data),
  updatePermission: (id: string, data: any) =>
    api.put(`/materials/${id}/permissions`, data),
}

export const todosApi = {
  list: (params?: Record<string, any>) =>
    api.get(
      `/todos?${new URLSearchParams(params as any).toString()}`
    ),
  create: (data: any) => api.post('/todos', data),
  update: (id: string, data: any) => api.put(`/todos/${id}`, data),
}

export const anomaliesApi = {
  list: (params?: Record<string, any>) =>
    api.get(
      `/anomalies?${new URLSearchParams(params as any).toString()}`
    ),
  create: (data: any) => api.post('/anomalies', data),
  close: (id: string, data: any) =>
    api.put(`/anomalies/${id}/close`, data),
  groupByType: () => api.get('/anomalies?groupByType=true'),
}

export const productionApi = {
  list: (params?: Record<string, any>) =>
    api.get(
      `/production?${new URLSearchParams(params as any).toString()}`
    ),
  create: (data: any) => api.post('/production', data),
}

export const exportsApi = {
  list: (params?: Record<string, any>) =>
    api.get(
      `/exports?${new URLSearchParams(params as any).toString()}`
    ),
  get: (id: string) => api.get(`/exports/${id}`),
  create: (data: any) => api.post('/exports', data),
}

export const usersApi = {
  list: (params?: Record<string, any>) =>
    api.get(
      `/users?${new URLSearchParams(params as any).toString()}`
    ),
}
