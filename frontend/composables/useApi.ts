import { useAuth } from './useAuth'

export const useApi = () => {
  const runtimeConfig = useRuntimeConfig()
  const apiBase = runtimeConfig.public.apiBase
  const { getToken } = useAuth()

  const getHeaders = (hasBody: boolean = true) => {
    const token = getToken()
    const headers: Record<string, string> = {}
    if (hasBody) {
      headers['Content-Type'] = 'application/json'
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

  const request = async <T>(
    url: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    options: {
      body?: any
      query?: Record<string, any>
      headers?: Record<string, string>
    } = {}
  ): Promise<T> => {
    try {
      const fullUrl = url.startsWith('http') ? url : `${apiBase}${url}`
      const hasBody = options.body !== undefined && options.body !== null

      const fetchOptions: any = {
        method,
        headers: {
          ...getHeaders(hasBody),
          ...options.headers
        }
      }

      if (options.query) {
        fetchOptions.query = options.query
      }

      if (hasBody) {
        fetchOptions.body = options.body
      }

      const res = await $fetch<T>(fullUrl, fetchOptions)
      return res
    } catch (error) {
      handleError(error)
      return {} as T
    }
  }

  const get = <T>(url: string, query?: Record<string, any>) =>
    request<T>(url, 'GET', { query })

  const post = <T>(url: string, body?: any, query?: Record<string, any>) =>
    request<T>(url, 'POST', { body, query })

  const put = <T>(url: string, body?: any, query?: Record<string, any>) =>
    request<T>(url, 'PUT', { body, query })

  const del = <T>(url: string, query?: Record<string, any>) =>
    request<T>(url, 'DELETE', { query })

  return { get, post, put, del, request }
}
