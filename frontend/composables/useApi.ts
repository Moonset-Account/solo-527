import { useMessage } from 'naive-ui'

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: any
  params?: Record<string, any>
  showError?: boolean
  showLoading?: boolean
}

export function useApi() {
  const message = useMessage()
  const authStore = useAuthStore()

  const config = useRuntimeConfig()
  const baseURL = config.public.apiBase || '/api'

  function buildQueryString(params?: Record<string, any>): string {
    if (!params) return ''
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value))
      }
    })
    return searchParams.toString()
  }

  async function request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const {
      method = 'GET',
      headers = {},
      body,
      params,
      showError = true,
    } = options

    const queryString = buildQueryString(params)
    const url = `${baseURL}${endpoint}${queryString ? `?${queryString}` : ''}`

    const finalHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    }

    if (authStore.token) {
      finalHeaders['Authorization'] = `Bearer ${authStore.token}`
    }

    try {
      const response = await $fetch<ApiResponse<T>>(url, {
        method,
        headers: finalHeaders,
        body: body ? JSON.stringify(body) : undefined,
      })

      if (response.code === 0 || response.code === 200) {
        return response.data
      } else {
        if (showError) {
          message.error(response.message || '请求失败')
        }
        throw new Error(response.message || '请求失败')
      }
    } catch (error: any) {
      if (error?.status === 401) {
        authStore.logout()
        if (showError) {
          message.error('登录已过期，请重新登录')
        }
      } else if (showError) {
        message.error(error?.data?.message || error.message || '网络错误')
      }
      throw error
    }
  }

  async function get<T>(endpoint: string, params?: Record<string, any>, options?: Omit<RequestOptions>): Promise<T> {
    return request<T>(endpoint, { ...options, method: 'GET', params })
  }

  async function post<T>(endpoint: string, body?: any, options?: Omit<RequestOptions>): Promise<T> {
    return request<T>(endpoint, { ...options, method: 'POST', body })
  }

  async function put<T>(endpoint: string, body?: any, options?: Omit<RequestOptions>): Promise<T> {
    return request<T>(endpoint, { ...options, method: 'PUT', body })
  }

  async function del<T>(endpoint: string, options?: Omit<RequestOptions>): Promise<T> {
    return request<T>(endpoint, { ...options, method: 'DELETE' })
  }

  return {
    request,
    get,
    post,
    put,
    del,
  }
}
