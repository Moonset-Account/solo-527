const BASE_URL = '/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

async function request<T>(
  path: string,
  options: RequestInit & { params?: Record<string, string | number | undefined> } = {}
): Promise<T> {
  const { params, ...init } = options;

  let url = `${BASE_URL}${path}`;
  if (params) {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') sp.set(k, String(v));
    });
    const qs = sp.toString();
    if (qs) url += `?${qs}`;
  }

  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...init, headers });

  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Request failed: ${res.status}`);
  }

  if (res.headers.get('content-type')?.includes('application/json')) {
    return res.json();
  }
  return res as unknown as T;
}

export const api = {
  get<T>(path: string, params?: Record<string, string | number | undefined>) {
    return request<T>(path, { method: 'GET', params });
  },
  post<T>(path: string, data?: unknown) {
    return request<T>(path, { method: 'POST', body: data ? JSON.stringify(data) : undefined });
  },
  put<T>(path: string, data?: unknown) {
    return request<T>(path, { method: 'PUT', body: data ? JSON.stringify(data) : undefined });
  },
  patch<T>(path: string, data?: unknown) {
    return request<T>(path, { method: 'PATCH', body: data ? JSON.stringify(data) : undefined });
  },
  delete<T>(path: string) {
    return request<T>(path, { method: 'DELETE' });
  },
};
