import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'

export function useApi() {
  const loading = ref(false)

  async function request<T = any>(url: string, options: RequestInit = {}): Promise<T | null> {
    loading.value = true
    const auth = useAuthStore()

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    }

    if (auth.token) {
      headers['Authorization'] = auth.token
    }

    try {
      const res = await fetch(url, {
        ...options,
        headers,
      })

      const data = await res.json()

      if (res.status === 401) {
        auth.logout()
        ElMessage.error('登录已过期，请重新登录')
        return null
      }

      if (!data.success) {
        ElMessage.error(data.error || '请求失败')
        return null
      }

      return data.data as T
    } catch {
      ElMessage.error('网络错误')
      return null
    } finally {
      loading.value = false
    }
  }

  async function get<T = any>(url: string): Promise<T | null> {
    return request<T>(url, { method: 'GET' })
  }

  async function post<T = any>(url: string, body?: any): Promise<T | null> {
    return request<T>(url, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  async function put<T = any>(url: string, body?: any): Promise<T | null> {
    return request<T>(url, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  async function del<T = any>(url: string): Promise<T | null> {
    return request<T>(url, { method: 'DELETE' })
  }

  return { loading, request, get, post, put, del }
}
