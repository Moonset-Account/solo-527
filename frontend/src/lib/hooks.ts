import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { request, ApiResponse } from '@/lib/api';

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  [key: string]: any;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

function buildQueryString(params?: Record<string, any>): string {
  if (!params) return '';
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    if (Array.isArray(v)) {
      v.forEach((item) => usp.append(k, String(item)));
    } else {
      usp.set(k, String(v));
    }
  }
  const s = usp.toString();
  return s ? `?${s}` : '';
}

export function useApiQuery<T>(
  queryKey: readonly unknown[],
  url: string,
  params?: Record<string, any>,
  options?: Omit<UseQueryOptions<ApiResponse<T>, Error, any>, 'queryKey' | 'queryFn'>
) {
  return useQuery<ApiResponse<T>>({
    queryKey,
    queryFn: async () => {
      const fullUrl = params ? `${url}${buildQueryString(params)}` : url;
      return request<T>({ url: fullUrl, method: 'GET' });
    },
    ...options,
  });
}

export async function apiPost<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
  return request<T>({ url, method: 'POST', data });
}

export async function apiPut<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
  return request<T>({ url, method: 'PUT', data });
}

export async function apiDelete<T = any>(url: string): Promise<ApiResponse<T>> {
  return request<T>({ url, method: 'DELETE' });
}

export async function apiDownload(url: string, data?: any, fileName?: string, method = 'POST') {
  const token = localStorage.getItem('qinghe-auth-storage');
  let authHeader = {};
  if (token) {
    try {
      const parsed = JSON.parse(token);
      if (parsed.state?.token) authHeader = { Authorization: `Bearer ${parsed.state.token}` };
    } catch {}
  }
  const res = await fetch(`/api${url}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...authHeader },
    body: data ? JSON.stringify(data) : undefined,
  });
  if (!res.ok) throw new Error('下载失败');
  const blob = await res.blob();
  const cd = res.headers.get('Content-Disposition');
  let finalName = fileName || 'export.xlsx';
  if (cd) {
    const m = cd.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)/i);
    if (m) finalName = decodeURIComponent(m[1]);
  }
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = finalName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}
