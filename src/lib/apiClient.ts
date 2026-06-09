import useAuthStore from '@/store/authStore';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

interface FetchOptions extends Omit<RequestInit, 'body'> {
  headers?: Record<string, string>;
  body?: BodyInit | Record<string, unknown> | unknown[] | null;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getHeaders(additionalHeaders: Record<string, string> = {}): Record<string, string> {
    const token = useAuthStore.getState().token;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...additionalHeaders,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private handleResponse(response: Response): Promise<unknown> {
    if (response.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
      return Promise.reject(new Error('Unauthorized'));
    }
    if (!response.ok) {
      return response.json().then(
        (err) => Promise.reject(err),
        () => Promise.reject(new Error(`HTTP ${response.status}`))
      );
    }
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    return response.text() as Promise<unknown>;
  }

  private async request<T = unknown>(url: string, options: FetchOptions = {}): Promise<T> {
    const { body, headers, ...rest } = options;
    let processedBody: BodyInit | undefined;
    if (body !== undefined && body !== null) {
      if (typeof body === 'string' || body instanceof FormData || body instanceof Blob || body instanceof ArrayBuffer || ArrayBuffer.isView(body)) {
        processedBody = body as BodyInit;
      } else {
        processedBody = JSON.stringify(body);
      }
    }
    const response = await fetch(`${this.baseUrl}${url}`, {
      ...rest,
      headers: this.getHeaders(headers),
      body: processedBody,
    });
    return this.handleResponse(response) as Promise<T>;
  }

  get<T = unknown>(url: string, options?: FetchOptions): Promise<T> {
    return this.request<T>(url, { ...options, method: 'GET' });
  }

  post<T = unknown>(url: string, body?: unknown, options?: FetchOptions): Promise<T> {
    return this.request<T>(url, { ...options, method: 'POST', body: body as BodyInit | Record<string, unknown> | unknown[] });
  }

  put<T = unknown>(url: string, body?: unknown, options?: FetchOptions): Promise<T> {
    return this.request<T>(url, { ...options, method: 'PUT', body: body as BodyInit | Record<string, unknown> | unknown[] });
  }

  patch<T = unknown>(url: string, body?: unknown, options?: FetchOptions): Promise<T> {
    return this.request<T>(url, { ...options, method: 'PATCH', body: body as BodyInit | Record<string, unknown> | unknown[] });
  }

  delete<T = unknown>(url: string, options?: FetchOptions): Promise<T> {
    return this.request<T>(url, { ...options, method: 'DELETE' });
  }
}

const apiClient = new ApiClient(BASE_URL);

export default apiClient;
export { BASE_URL };
