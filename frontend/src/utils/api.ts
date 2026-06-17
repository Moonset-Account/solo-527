const API_BASE = '/api';

interface RequestOptions extends RequestInit {
  params?: Record<string, any>;
  showError?: boolean;
}

export async function request<T = any>(
  url: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, showError = true, ...rest } = options;
  const token = localStorage.getItem('token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(rest.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let fullUrl = API_BASE + url;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    fullUrl += `?${searchParams.toString()}`;
  }

  try {
    const response = await fetch(fullUrl, {
      ...rest,
      headers,
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      if (showError) {
        console.error('API Error:', data.error || data.message);
      }
      throw new Error(data.error || data.message || '请求失败');
    }

    return data.data as T;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('网络请求失败');
  }
}

export const api = {
  get: <T = any>(url: string, params?: Record<string, any>, options?: Omit<RequestOptions, 'params' | 'method'>) =>
    request<T>(url, { ...options, params, method: 'GET' }),

  post: <T = any>(url: string, data?: any, options?: Omit<RequestOptions, 'body' | 'method'>) =>
    request<T>(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T = any>(url: string, data?: any, options?: Omit<RequestOptions, 'body' | 'method'>) =>
    request<T>(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T = any>(url: string, data?: any, options?: Omit<RequestOptions, 'body' | 'method'>) =>
    request<T>(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T = any>(url: string, options?: Omit<RequestOptions, 'method'>) =>
    request<T>(url, { ...options, method: 'DELETE' }),
};

export const exportUrl = (url: string, params?: Record<string, any>) => {
  const token = localStorage.getItem('token');
  let fullUrl = API_BASE + url;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    fullUrl += `?${searchParams.toString()}`;
  }

  const link = document.createElement('a');
  link.href = fullUrl;
  link.target = '_blank';
  link.click();
};
