import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import type { ApiResponse } from '@/types'

declare module 'axios' {
  interface InternalAxiosRequestConfig {
    showLoading?: boolean
    loadingText?: string
  }
  interface AxiosRequestConfig {
    showLoading?: boolean
    loadingText?: string
  }
}

const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const authStore = useAuthStore()
    const appStore = useAppStore()

    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }

    if (config.showLoading !== false) {
      appStore.setLoading(true, config.loadingText || '加载中...')
    }

    return config
  },
  (error) => {
    const appStore = useAppStore()
    appStore.setLoading(false)
    return Promise.reject(error)
  }
)

service.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const appStore = useAppStore()
    appStore.setLoading(false)

    const res = response.data

    if (res.code !== 0 && res.code !== 200) {
      const message = res.message || '请求失败'
      window.$message?.error(message)

      if (res.code === 401) {
        const authStore = useAuthStore()
        authStore.logout()
        window.location.href = '/login'
      }

      return Promise.reject(new Error(message))
    }

    return res.data as unknown as AxiosResponse
  },
  (error) => {
    const appStore = useAppStore()
    appStore.setLoading(false)

    const status = error.response?.status
    const message = error.response?.data?.message || error.message || '网络错误'

    if (status === 401) {
      const authStore = useAuthStore()
      authStore.logout()
      window.location.href = '/login'
    } else if (status === 403) {
      window.$message?.error('没有权限访问该资源')
    } else if (status === 404) {
      window.$message?.error('请求的资源不存在')
    } else if (status === 500) {
      window.$message?.error('服务器内部错误')
    } else {
      window.$message?.error(message)
    }

    return Promise.reject(error)
  }
)

export interface RequestConfig extends AxiosRequestConfig {
  showLoading?: boolean
  loadingText?: string
}

export function request<T = unknown>(config: RequestConfig): Promise<T> {
  return service.request<unknown, T>(config)
}

export function get<T = unknown>(url: string, params?: Record<string, unknown>, config?: RequestConfig): Promise<T> {
  return request<T>({ ...config, method: 'GET', url, params })
}

export function post<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
  return request<T>({ ...config, method: 'POST', url, data })
}

export function put<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
  return request<T>({ ...config, method: 'PUT', url, data })
}

export function del<T = unknown>(url: string, params?: Record<string, unknown>, config?: RequestConfig): Promise<T> {
  return request<T>({ ...config, method: 'DELETE', url, params })
}

export default service
