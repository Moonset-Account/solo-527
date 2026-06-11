import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores'

export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const userStore = useUserStore()
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

service.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const res = response.data
    if (res.code !== 0 && res.code !== 200) {
      ElMessage.error(res.message || '请求失败')
      if (res.code === 401) {
        ElMessageBox.confirm('登录状态已过期，您可以继续留在该页面，或者重新登录', '系统提示', {
          confirmButtonText: '重新登录',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          const userStore = useUserStore()
          userStore.logout()
          location.reload()
        })
      }
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return res as unknown as AxiosResponse<any, any>
  },
  (error) => {
    ElMessage.error(error.message || '网络错误')
    return Promise.reject(error)
  }
)

export function request<T = any>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
  return service.request<any, ApiResponse<T>>(config)
}

export function get<T = any>(url: string, params?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
  return request<T>({ method: 'GET', url, params, ...config })
}

export function post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
  return request<T>({ method: 'POST', url, data, ...config })
}

export function put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
  return request<T>({ method: 'PUT', url, data, ...config })
}

export function del<T = any>(url: string, params?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
  return request<T>({ method: 'DELETE', url, params, ...config })
}

export default service
