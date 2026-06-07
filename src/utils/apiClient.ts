const API_BASE = 'http://localhost:3001/api';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  total?: number;
  imported?: number;
  skipped?: number;
}

function getToken(): string | null {
  return localStorage.getItem('auth_token');
}

function setToken(token: string): void {
  localStorage.setItem('auth_token', token);
}

function clearToken(): void {
  localStorage.removeItem('auth_token');
}

async function request<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      clearToken();
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }

    return await response.json();
  } catch (error) {
    console.error(`[API] Request failed: ${path}`, error);
    return {
      success: false,
      error: '网络请求失败',
    };
  }
}

export const api = {
  auth: {
    login: async (username: string, password: string) => {
      return request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
    },
    logout: async () => {
      const result = await request('/auth/logout', {
        method: 'POST',
      });
      clearToken();
      return result;
    },
    me: async () => {
      return request('/auth/me');
    },
  },

  overview: {
    get: async () => {
      return request('/overview');
    },
  },

  sites: {
    list: async () => {
      return request('/sites');
    },
    get: async (id: string) => {
      return request(`/sites/${id}`);
    },
    create: async (data: any) => {
      return request('/sites', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  },

  measurements: {
    list: async (params?: Record<string, any>) => {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            value.forEach((v) => searchParams.append(key, v));
          } else if (value !== undefined && value !== null) {
            searchParams.append(key, String(value));
          }
        });
      }
      const query = searchParams.toString();
      return request(`/measurements${query ? `?${query}` : ''}`);
    },
    trend: async (params?: Record<string, any>) => {
      const searchParams = new URLSearchParams(params as any);
      const query = searchParams.toString();
      return request(`/measurements/trend${query ? `?${query}` : ''}`);
    },
    import: async (data: any[]) => {
      return request('/measurements/import', {
        method: 'POST',
        body: JSON.stringify({ data }),
      });
    },
    exportCSV: async () => {
      const token = getToken();
      const response = await fetch(`${API_BASE}/measurements/export/csv`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('导出失败');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'water_quality_data.csv';
      a.click();
      window.URL.revokeObjectURL(url);
      return { success: true };
    },
  },

  anomalies: {
    list: async (params?: Record<string, any>) => {
      const searchParams = new URLSearchParams(params as any);
      const query = searchParams.toString();
      return request(`/anomalies${query ? `?${query}` : ''}`);
    },
    getNotes: async (measurementId: string) => {
      return request(`/anomalies/${measurementId}/notes`);
    },
    addNote: async (measurementId: string, content: string) => {
      return request(`/anomalies/${measurementId}/notes`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
    },
  },

  quality: {
    check: async () => {
      return request('/quality');
    },
  },

  datadict: {
    get: async () => {
      return request('/datadict');
    },
  },

  setToken,
  clearToken,
  getToken,
};
