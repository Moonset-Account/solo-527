const API_BASE = '/api';

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '请求失败' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  if (response.headers.get('content-type')?.includes('application/json')) {
    return response.json();
  }
  
  return response as any;
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, data: any) =>
    request<T>(endpoint, { method: 'POST', body: JSON.stringify(data) }),
  put: <T>(endpoint: string, data: any) =>
    request<T>(endpoint, { method: 'PUT', body: JSON.stringify(data) }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
};

export const authApi = {
  login: (email: string, password: string) =>
    api.post<any>('/auth/login', { email, password }),
  logout: () => api.post<any>('/auth/logout', {}),
  me: () => api.get<any>('/auth/me'),
};

export const projectApi = {
  list: () => api.get<any[]>('/projects'),
  get: (id: number) => api.get<any>(`/projects/${id}`),
  create: (data: any) => api.post<any>('/projects', data),
  update: (id: number, data: any) => api.put<any>(`/projects/${id}`, data),
  delete: (id: number) => api.delete<any>(`/projects/${id}`),
  getFiles: (id: number) => api.get<any[]>(`/projects/${id}/files`),
  uploadFile: async (id: number, file: File, isPublic: boolean = false) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('is_public', String(isPublic));
    const response = await fetch(`/api/projects/${id}/files`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: '上传失败' }));
      throw new Error(error.error || '上传失败');
    }
    return response.json();
  },
};

export const clientApi = {
  list: () => api.get<any[]>('/clients'),
  get: (id: number) => api.get<any>(`/clients/${id}`),
  create: (data: any) => api.post<any>('/clients', data),
  update: (id: number, data: any) => api.put<any>(`/clients/${id}`, data),
  delete: (id: number) => api.delete<any>(`/clients/${id}`),
};

export const taskApi = {
  list: (params?: { project_id?: number; assignee_id?: number }) => {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return api.get<any[]>(`/tasks${query}`);
  },
  get: (id: number) => api.get<any>(`/tasks/${id}`),
  create: (data: any) => api.post<any>('/tasks', data),
  update: (id: number, data: any) => api.put<any>(`/tasks/${id}`, data),
  delete: (id: number) => api.delete<any>(`/tasks/${id}`),
};

export const timeEntryApi = {
  list: (params?: { project_id?: number; user_id?: number }) => {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return api.get<any[]>(`/time-entries${query}`);
  },
  create: (data: any) => api.post<any>('/time-entries', data),
};

export const invoiceApi = {
  list: () => api.get<any[]>('/invoices'),
  get: (id: number) => api.get<any>(`/invoices/${id}`),
  create: (data: any) => api.post<any>('/invoices', data),
  update: (id: number, data: any) => api.put<any>(`/invoices/${id}`, data),
  delete: (id: number) => api.delete<any>(`/invoices/${id}`),
  send: (id: number) => api.post<any>(`/invoices/${id}/send`, {}),
  addPayment: (id: number, data: any) =>
    api.post<any>(`/invoices/${id}/payments`, data),
};

export const quoteApi = {
  list: () => api.get<any[]>('/quotes'),
  get: (id: number) => api.get<any>(`/quotes/${id}`),
  create: (data: any) => api.post<any>('/quotes', data),
  update: (id: number, data: any) => api.put<any>(`/quotes/${id}`, data),
  delete: (id: number) => api.delete<any>(`/quotes/${id}`),
  templates: () => api.get<any[]>('/quotes?templates=true'),
};

export const notificationApi = {
  list: () => api.get<any[]>('/notifications'),
  getUnreadCount: () => api.get<{ count: number }>('/notifications?unread=count'),
  markRead: (id: number) => api.post<any>('/notifications', { id, read: true }),
  markAllRead: () => api.post<any>('/notifications', { mark_all_read: true }),
};

export const statsApi = {
  getDashboard: () => api.get<any>('/stats'),
  getRevenue: () => api.get<any>('/stats?type=revenue'),
  getMonthly: () => api.get<any[]>('/stats?type=monthly'),
};

export const exportApi = {
  invoices: () => window.open('/api/export?type=invoices', '_blank'),
  timeEntries: (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams({ type: 'time-entries' } as any);
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    window.open(`/api/export?${params.toString()}`, '_blank');
  },
  revenue: () => window.open('/api/export?type=revenue', '_blank'),
};
