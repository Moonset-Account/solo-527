import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import { message } from 'antd'
import { useAuthStore } from '@/store/auth'

const request: AxiosInstance = axios.create({
  timeout: 30000,
})

request.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

request.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const refreshToken = useAuthStore.getState().refreshToken
        if (refreshToken) {
          const { data } = await axios.post('/api/auth/refresh/', {
            refresh: refreshToken,
          })
          localStorage.setItem('access_token', data.access)
          useAuthStore.setState({ token: data.access })
          originalRequest.headers.Authorization = `Bearer ${data.access}`
          return request(originalRequest)
        }
      } catch {
        useAuthStore.getState().logout()
        message.error('登录已过期，请重新登录')
        window.location.href = '/login'
      }
    }
    if (error.response?.data?.detail) {
      message.error(error.response.data.detail)
    } else if (error.message) {
      message.error(error.message)
    }
    return Promise.reject(error)
  }
)

export default request
