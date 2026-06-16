import { useAuthStore } from '~/stores/auth'

export const useApi = () => {
  const config = useRuntimeConfig()
  const authStore = useAuthStore()

  const request = async <T>(
    path: string,
    options: RequestInit & { params?: Record<string, any> } = {}
  ): Promise<T> => {
    const url = new URL(config.public.apiBase + path)

    if (options.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value))
        }
      })
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    }

    if (authStore.token) {
      headers['Authorization'] = `Bearer ${authStore.token}`
    }

    try {
      const response = await fetch(url.toString(), {
        ...options,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      })

      if (response.status === 401) {
        authStore.logout()
        if (process.client) {
          window.location.href = '/login'
        }
        throw new Error('认证失败')
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || '请求失败')
      }

      return data as T
    } catch (error: any) {
      throw new Error(error.message || '网络错误')
    }
  }

  return {
    get: <T>(path: string, params?: Record<string, any>) =>
      request<T>(path, { method: 'GET', params }),
    post: <T>(path: string, body?: any, params?: Record<string, any>) =>
      request<T>(path, { method: 'POST', body, params }),
    put: <T>(path: string, body?: any, params?: Record<string, any>) =>
      request<T>(path, { method: 'PUT', body, params }),
    delete: <T>(path: string, params?: Record<string, any>) =>
      request<T>(path, { method: 'DELETE', params }),
  }
}
