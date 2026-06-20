import { get } from 'svelte/store';
import { currentUser } from '$stores/user';

async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<{ data: T; status: number; ok: boolean }> {
  const user = get(currentUser);

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-user-id': user.id,
    'x-user-name': encodeURIComponent(user.name),
    'x-user-role': user.role
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers
    }
  });

  let data: T;
  try {
    data = (await response.json()) as T;
  } catch {
    data = {} as T;
  }

  return {
    data,
    status: response.status,
    ok: response.ok
  };
}

export const api = {
  get: <T>(url: string) => request<T>(url, { method: 'GET' }),
  post: <T>(url: string, body?: unknown) =>
    request<T>(url, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined
    }),
  put: <T>(url: string, body?: unknown) =>
    request<T>(url, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined
    }),
  delete: <T>(url: string) => request<T>(url, { method: 'DELETE' })
};

export default api;
