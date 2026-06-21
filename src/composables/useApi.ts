import { ref } from 'vue'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export function useApi() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  function getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    const token = localStorage.getItem('auth_token')
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    return headers
  }

  async function request<T>(url: string, options?: RequestInit): Promise<T> {
    loading.value = true
    error.value = null
    try {
      const response = await fetch(`${BASE_URL}${url}`, {
        ...options,
        headers: {
          ...getHeaders(),
          ...options?.headers,
        },
      })
      if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`)
      }
      const data = await response.json()
      return data as T
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '未知错误'
      error.value = message
      throw e
    } finally {
      loading.value = false
    }
  }

  function get<T>(url: string) {
    return request<T>(url, { method: 'GET' })
  }

  function post<T>(url: string, body: unknown) {
    return request<T>(url, { method: 'POST', body: JSON.stringify(body) })
  }

  function put<T>(url: string, body: unknown) {
    return request<T>(url, { method: 'PUT', body: JSON.stringify(body) })
  }

  function del<T>(url: string) {
    return request<T>(url, { method: 'DELETE' })
  }

  return { loading, error, get, post, put, del }
}
