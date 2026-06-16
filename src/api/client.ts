import type { PaginatedResponse } from '@/types';

const BASE_URL = '/api/v1';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || `请求失败: ${res.status}`);
  }
  return res.json();
}

export const api = {
  get<T>(path: string, params?: Record<string, string | number>): Promise<T> {
    const url = params
      ? `${path}?${new URLSearchParams(
          Object.entries(params).reduce<Record<string, string>>((acc, [k, v]) => {
            acc[k] = String(v);
            return acc;
          }, {})
        ).toString()}`
      : path;
    return request<T>(url);
  },

  post<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  put<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  delete<T>(path: string): Promise<T> {
    return request<T>(path, { method: 'DELETE' });
  },

  getList<T>(path: string, params?: Record<string, string | number>): Promise<PaginatedResponse<T>> {
    return api.get<PaginatedResponse<T>>(path, params);
  },
};
