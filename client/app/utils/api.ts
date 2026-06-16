const API_BASE = '/api';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
}

export async function request<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers,
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      message: '网络请求失败',
    };
  }
}

export const api = {
  get: <T = any>(url: string) => request<T>(url, { method: 'GET' }),
  post: <T = any>(url: string, data?: any) =>
    request<T>(url, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  put: <T = any>(url: string, data?: any) =>
    request<T>(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: <T = any>(url: string) => request<T>(url, { method: 'DELETE' }),
};

export const authApi = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  register: (data: any) => api.post('/auth/register', data),
  getCurrentUser: () => api.get('/auth/me'),
  changePassword: (oldPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { oldPassword, newPassword }),
  logout: () => api.post('/auth/logout'),
};

export const storeApi = {
  getList: (params?: any) => {
    const query = new URLSearchParams(params || {}).toString();
    return api.get(`/stores${query ? `?${query}` : ''}`);
  },
  getById: (id: string) => api.get(`/stores/${id}`),
  create: (data: any) => api.post('/stores', data),
  update: (id: string, data: any) => api.put(`/stores/${id}`, data),
  delete: (id: string) => api.delete(`/stores/${id}`),
};

export const userApi = {
  getList: (params?: any) => {
    const query = new URLSearchParams(params || {}).toString();
    return api.get(`/users${query ? `?${query}` : ''}`);
  },
  getById: (id: string) => api.get(`/users/${id}`),
  create: (data: any) => api.post('/users', data),
  update: (id: string, data: any) => api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
  updatePermissions: (id: string, permissions: string[]) =>
    api.put(`/users/${id}/permissions`, { permissions }),
};

export const businessApi = {
  getList: (params?: any) => {
    const query = new URLSearchParams(params || {}).toString();
    return api.get(`/business${query ? `?${query}` : ''}`);
  },
  getById: (id: string) => api.get(`/business/${id}`),
  create: (data: any) => api.post('/business', data),
  update: (id: string, data: any) => api.put(`/business/${id}`, data),
  delete: (id: string) => api.delete(`/business/${id}`),
  getProfitStats: (params?: any) => {
    const query = new URLSearchParams(params || {}).toString();
    return api.get(`/business/profit-stats${query ? `?${query}` : ''}`);
  },
};

export const anomalyApi = {
  getList: (params?: any) => {
    const query = new URLSearchParams(params || {}).toString();
    return api.get(`/anomalies${query ? `?${query}` : ''}`);
  },
  getById: (id: string) => api.get(`/anomalies/${id}`),
  create: (data: any) => api.post('/anomalies', data),
  update: (id: string, data: any) => api.put(`/anomalies/${id}`, data),
  resolve: (id: string, data: any) => api.put(`/anomalies/${id}/resolve`, data),
  delete: (id: string) => api.delete(`/anomalies/${id}`),
};

export const rectificationApi = {
  getList: (params?: any) => {
    const query = new URLSearchParams(params || {}).toString();
    return api.get(`/rectifications${query ? `?${query}` : ''}`);
  },
  getById: (id: string) => api.get(`/rectifications/${id}`),
  create: (data: any) => api.post('/rectifications', data),
  update: (id: string, data: any) => api.put(`/rectifications/${id}`, data),
  submit: (id: string, data: any) => api.put(`/rectifications/${id}/submit`, data),
  review: (id: string, data: any) => api.put(`/rectifications/${id}/review`, data),
  close: (id: string) => api.put(`/rectifications/${id}/close`),
  delete: (id: string) => api.delete(`/rectifications/${id}`),
};

export const inventoryApi = {
  getList: (params?: any) => {
    const query = new URLSearchParams(params || {}).toString();
    return api.get(`/inventory${query ? `?${query}` : ''}`);
  },
  getLowStock: (params?: any) => {
    const query = new URLSearchParams(params || {}).toString();
    return api.get(`/inventory/low-stock${query ? `?${query}` : ''}`);
  },
  getById: (id: string) => api.get(`/inventory/${id}`),
  create: (data: any) => api.post('/inventory', data),
  update: (id: string, data: any) => api.put(`/inventory/${id}`, data),
  restock: (id: string, data: any) => api.put(`/inventory/${id}/restock`, data),
  consume: (id: string, data: any) => api.put(`/inventory/${id}/consume`, data),
  delete: (id: string) => api.delete(`/inventory/${id}`),
};

export const couponApi = {
  getList: (params?: any) => {
    const query = new URLSearchParams(params || {}).toString();
    return api.get(`/coupons${query ? `?${query}` : ''}`);
  },
  getExpiring: (params?: any) => {
    const query = new URLSearchParams(params || {}).toString();
    return api.get(`/coupons/expiring${query ? `?${query}` : ''}`);
  },
  getById: (id: string) => api.get(`/coupons/${id}`),
  create: (data: any) => api.post('/coupons', data),
  update: (id: string, data: any) => api.put(`/coupons/${id}`, data),
  use: (id: string) => api.put(`/coupons/${id}/use`),
  delete: (id: string) => api.delete(`/coupons/${id}`),
};

export const cashDiffApi = {
  getList: (params?: any) => {
    const query = new URLSearchParams(params || {}).toString();
    return api.get(`/cash-differences${query ? `?${query}` : ''}`);
  },
  getStats: (params?: any) => {
    const query = new URLSearchParams(params || {}).toString();
    return api.get(`/cash-differences/stats${query ? `?${query}` : ''}`);
  },
  getById: (id: string) => api.get(`/cash-differences/${id}`),
  create: (data: any) => api.post('/cash-differences', data),
  update: (id: string, data: any) => api.put(`/cash-differences/${id}`, data),
  handle: (id: string, data: any) => api.put(`/cash-differences/${id}/handle`, data),
  delete: (id: string) => api.delete(`/cash-differences/${id}`),
};

export const logApi = {
  getList: (params?: any) => {
    const query = new URLSearchParams(params || {}).toString();
    return api.get(`/logs${query ? `?${query}` : ''}`);
  },
  getById: (id: string) => api.get(`/logs/${id}`),
  getStats: (params?: any) => {
    const query = new URLSearchParams(params || {}).toString();
    return api.get(`/logs/stats${query ? `?${query}` : ''}`);
  },
};

export const reminderApi = {
  getList: (params?: any) => {
    const query = new URLSearchParams(params || {}).toString();
    return api.get(`/reminders${query ? `?${query}` : ''}`);
  },
  getById: (id: string) => api.get(`/reminders/${id}`),
  markAsRead: (id: string) => api.put(`/reminders/${id}/read`),
  markAllAsRead: (params?: any) => {
    const query = new URLSearchParams(params || {}).toString();
    return api.put(`/reminders/read-all${query ? `?${query}` : ''}`);
  },
  process: (id: string, data: any) => api.put(`/reminders/${id}/process`, data),
  dismiss: (id: string) => api.put(`/reminders/${id}/dismiss`),
  delete: (id: string) => api.delete(`/reminders/${id}`),
};

export const inspectionApi = {
  getList: (params?: any) => {
    const query = new URLSearchParams(params || {}).toString();
    return api.get(`/inspections${query ? `?${query}` : ''}`);
  },
  getById: (id: string) => api.get(`/inspections/${id}`),
  create: (data: any) => api.post('/inspections', data),
  update: (id: string, data: any) => api.put(`/inspections/${id}`, data),
  start: (id: string) => api.put(`/inspections/${id}/start`),
  complete: (id: string, data: any) => api.put(`/inspections/${id}/complete`, data),
  delete: (id: string) => api.delete(`/inspections/${id}`),
};

export const dashboardApi = {
  getStats: (params?: any) => {
    const query = new URLSearchParams(params || {}).toString();
    return api.get(`/dashboard/stats${query ? `?${query}` : ''}`);
  },
  getActivities: (params?: any) => {
    const query = new URLSearchParams(params || {}).toString();
    return api.get(`/dashboard/activities${query ? `?${query}` : ''}`);
  },
  runRules: (params?: any) => {
    const query = new URLSearchParams(params || {}).toString();
    return api.post(`/dashboard/run-rules${query ? `?${query}` : ''}`);
  },
};
