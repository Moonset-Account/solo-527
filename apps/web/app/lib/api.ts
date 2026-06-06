const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api';

interface ApiRequestOptions extends RequestInit {
  token?: string;
}

export async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { token, headers, ...rest } = options;
  
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...rest,
    headers: {
      ...defaultHeaders,
      ...headers,
    },
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '请求失败' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  
  return response.json();
}

export const api = {
  auth: {
    login: (username: string, password: string) =>
      apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),
    me: (token: string) =>
      apiRequest('/auth/me', { token }),
  },
  materials: {
    list: (token: string, params?: any) => {
      const query = new URLSearchParams(params).toString();
      return apiRequest(`/materials${query ? `?${query}` : ''}`, { token });
    },
    get: (token: string, id: string) =>
      apiRequest(`/materials/${id}`, { token }),
    getByQr: (token: string, qrCode: string) =>
      apiRequest(`/materials/qr/${qrCode}`, { token }),
    categories: (token: string) =>
      apiRequest('/materials/categories', { token }),
    create: (token: string, data: any) =>
      apiRequest('/materials', {
        method: 'POST',
        token,
        body: JSON.stringify(data),
      }),
    checkAvailability: (token: string, materialId: string, startDate: string, endDate: string) =>
      apiRequest(`/borrows/check-availability?materialId=${materialId}&startDate=${startDate}&endDate=${endDate}`, { token }),
  },
  activities: {
    list: (token: string, params?: any) => {
      const query = new URLSearchParams(params).toString();
      return apiRequest(`/activities${query ? `?${query}` : ''}`, { token });
    },
    calendar: (token: string, year?: number, month?: number) => {
      const params = new URLSearchParams();
      if (year) params.set('year', String(year));
      if (month) params.set('month', String(month));
      const query = params.toString();
      return apiRequest(`/activities/calendar${query ? `?${query}` : ''}`, { token });
    },
    get: (token: string, id: string) =>
      apiRequest(`/activities/${id}`, { token }),
    create: (token: string, data: any) =>
      apiRequest('/activities', {
        method: 'POST',
        token,
        body: JSON.stringify(data),
      }),
  },
  borrows: {
    list: (token: string, params?: any) => {
      const query = new URLSearchParams(params).toString();
      return apiRequest(`/borrows${query ? `?${query}` : ''}`, { token });
    },
    get: (token: string, id: string) =>
      apiRequest(`/borrows/${id}`, { token }),
    create: (token: string, data: any) =>
      apiRequest('/borrows', {
        method: 'POST',
        token,
        body: JSON.stringify(data),
      }),
    approve: (token: string, id: string) =>
      apiRequest(`/borrows/${id}/approve`, {
        method: 'PUT',
        token,
      }),
    reject: (token: string, id: string, reason?: string) =>
      apiRequest(`/borrows/${id}/reject`, {
        method: 'PUT',
        token,
        body: JSON.stringify({ reason }),
      }),
    cancel: (token: string, id: string) =>
      apiRequest(`/borrows/${id}/cancel`, {
        method: 'PUT',
        token,
      }),
    borrow: (token: string, data: any) =>
      apiRequest('/borrows/borrow', {
        method: 'POST',
        token,
        body: JSON.stringify(data),
      }),
    return: (token: string, data: any) =>
      apiRequest('/borrows/return', {
        method: 'POST',
        token,
        body: JSON.stringify(data),
      }),
  },
  compensations: {
    list: (token: string, status?: string) => {
      const query = status ? `?status=${status}` : '';
      return apiRequest(`/compensations${query}`, { token });
    },
    handle: (token: string, id: string, action: string, remarks?: string) =>
      apiRequest(`/compensations/${id}/handle`, {
        method: 'PUT',
        token,
        body: JSON.stringify({ action, remarks }),
      }),
    manualEntries: (token: string) =>
      apiRequest('/compensations/manual-entries', { token }),
    createManualEntry: (token: string, data: any) =>
      apiRequest('/compensations/manual-entries', {
        method: 'POST',
        token,
        body: JSON.stringify(data),
      }),
  },
  audit: {
    logs: (token: string, params?: any) => {
      const query = new URLSearchParams(params).toString();
      return apiRequest(`/audit/logs${query ? `?${query}` : ''}`, { token });
    },
    notifications: (token: string) =>
      apiRequest('/audit/notifications', { token }),
  },
};
