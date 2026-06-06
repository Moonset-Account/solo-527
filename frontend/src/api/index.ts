import axios from 'axios'
import { message } from 'antd'
import type { ApiResponse as IApiResponse } from '../types'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => {
    const data = response.data as IApiResponse
    if (data && data.success === false) {
      message.error(data.message || '请求失败')
      return Promise.reject(new Error(data.message))
    }
    return data
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    } else {
      message.error(error.response?.data?.message || error.message || '网络错误')
    }
    return Promise.reject(error)
  }
)

export async function get<T = any>(url: string, config?: any): Promise<T> {
  const res = await api.get<any, IApiResponse<T>>(url, config)
  return res.data
}

export async function post<T = any>(url: string, data?: any, config?: any): Promise<T> {
  const res = await api.post<any, IApiResponse<T>>(url, data, config)
  return res.data
}

export async function put<T = any>(url: string, data?: any, config?: any): Promise<T> {
  const res = await api.put<any, IApiResponse<T>>(url, data, config)
  return res.data
}

export async function del<T = any>(url: string, config?: any): Promise<T> {
  const res = await api.delete<any, IApiResponse<T>>(url, config)
  return res.data
}

export default api
