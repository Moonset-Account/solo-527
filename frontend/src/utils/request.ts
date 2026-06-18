import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import router from '@/router'

const request = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

let isRefreshing = false
let pendingRequests: Array<(token: string) => void> = []

request.interceptors.request.use(
  (config) => {
    const userStore = useUserStore()
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

request.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data
    if (res && typeof res === 'object' && 'success' in res) {
      if (res.success) {
        return res.data
      } else {
        ElMessage.error(res.message || '请求失败')
        return Promise.reject(new Error(res.message || 'Error'))
      }
    }
    return response.data
  },
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          pendingRequests.push((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            resolve(request(originalRequest))
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      const userStore = useUserStore()
      try {
        const refreshed = await userStore.refreshAccessToken()
        if (refreshed) {
          originalRequest.headers.Authorization = `Bearer ${userStore.token}`
          pendingRequests.forEach((cb) => cb(userStore.token))
          pendingRequests = []
          return request(originalRequest)
        }
      } catch (e) {
        // ignore
      } finally {
        isRefreshing = false
      }

      userStore.clearAll()
      ElMessage.error('登录已过期，请重新登录')
      router.push({ path: '/login' })
      return Promise.reject(error)
    }

    const message = error.response?.data?.message || error.message || '网络请求错误'
    if (error.response?.status !== 403) {
      ElMessage.error(message)
    }
    return Promise.reject(error)
  }
)

export default request

export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
  success: boolean
  timestamp: string
}

export interface PageResult<T = any> {
  list: T[]
  total: number
  page: number
  pageSize: number
}
