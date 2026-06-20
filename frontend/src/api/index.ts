import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { message } from 'antd'
import { useAuthStore } from '../store/auth'

const request: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

request.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    const token = useAuthStore.getState().token
    if (token && config.headers) {
      config.headers.Authorization = `Token ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

request.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  (error) => {
    if (error.response) {
      const { status, data } = error.response
      if (status === 401) {
        useAuthStore.getState().logout()
        window.location.href = '/login'
      } else if (status === 403) {
        message.error('无权限访问')
      } else if (status >= 400 && status < 500) {
        const msg = data?.detail || data?.message || '请求失败'
        if (typeof msg === 'string') {
          message.error(msg)
        } else if (Array.isArray(msg)) {
          msg.forEach(m => message.error(m))
        }
      } else if (status >= 500) {
        message.error('服务器错误')
      }
    } else if (error.message.includes('timeout')) {
      message.error('请求超时')
    } else {
      message.error('网络错误')
    }
    return Promise.reject(error)
  }
)

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface PaginationParams {
  page?: number
  page_size?: number
  ordering?: string
  search?: string
}

export default request
