import { useAuth } from './useAuth'

export const useApi = () => {
  const runtimeConfig = useRuntimeConfig()
  const apiBase = runtimeConfig.public.apiBase
  const { getToken } = useAuth()

  const getHeaders = () => {
    const token = getToken()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    return headers
  }

  const handleError = (error: any) => {
    console.error('API Error:', error)
    if (error.status === 401) {
      const { logout } = useAuth()
      logout()
    }
    throw error
  }

  const request = async <T>(url: string, options: any = {}): Promise<T> => {
    try {
      const fullUrl = url.startsWith('http') ? url : `${apiBase}${url}`
      const res = await $fetch<T>(fullUrl, {
        ...options,
        headers: {
          ...getHeaders(),
          ...options.headers
        }
      })
      return res
    } catch (error) {
      handleError(error)
      return {} as T
    }
  }

  const get = <T>(url: string, params?: any) => request<T>(url, { method: 'GET', query: params })
  const post = <T>(url: string, body?: any) => request<T>(url, { method: 'POST', body })
  const put = <T>(url: string, body?: any) => request<T>(url, { method: 'PUT', body })
  const del = <T>(url: string) => request<T>(url, { method: 'DELETE' })

  return { get, post, put, del, request }
}
