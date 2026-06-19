import axios, { type AxiosRequestConfig } from 'axios'

const config = useRuntimeConfig()

const api = axios.create({
  baseURL: config.public.apiBase || '/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}, (error) => {
  return Promise.reject(error)
})

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login'
        }
      }
      return Promise.reject(error.response.data || { detail: error.message })
    }
    return Promise.reject({ detail: '网络错误，请稍后重试' })
  }
)

export const apiClient = {
  get: <T = any>(url: string, params?: any) => api.get<T, T>(url, { params }),
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => api.post<T, T>(url, data, config),
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => api.put<T, T>(url, data, config),
  delete: <T = any>(url: string, config?: AxiosRequestConfig) => api.delete<T, T>(url, config),
  download: (url: string) => {
    const token = localStorage.getItem('token')
    return fetch(`${config.public.apiBase || '/api/v1'}${url}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
  }
}

export default api
