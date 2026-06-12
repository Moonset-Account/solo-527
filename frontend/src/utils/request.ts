import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { message } from 'antd'
import type { ApiResponse } from '../types'

const TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'

const request: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY)
}

export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token)
}

export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY)
}

export const getRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export const setRefreshToken = (refreshToken: string): void => {
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
}

export const removeRefreshToken = (): void => {
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

let isRefreshing = false
let refreshSubscribers: ((token: string) => void)[] = []

const subscribeTokenRefresh = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback)
}

const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach(callback => callback(token))
  refreshSubscribers = []
}

const refreshToken = async (): Promise<string> => {
  const refreshTokenValue = getRefreshToken()
  if (!refreshTokenValue) {
    throw new Error('No refresh token')
  }
  try {
    const response = await axios.post<ApiResponse<{ token: string; refreshToken: string; expiresIn: number }>>(
      `${import.meta.env.VITE_API_BASE_URL || '/api'}/auth/refresh-token`,
      { refreshToken: refreshTokenValue }
    )
    const { token, refreshToken: newRefreshToken } = response.data.data
    setToken(token)
    setRefreshToken(newRefreshToken)
    return token
  } catch (error) {
    removeToken()
    removeRefreshToken()
    throw error
  }
}

request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken()
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

request.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const res = response.data
    if (res.code !== 200) {
      if (res.code === 401) {
        const originalRequest = response.config
        if (!isRefreshing) {
          isRefreshing = true
          refreshToken()
            .then((token) => {
              onTokenRefreshed(token)
            })
            .catch(() => {
              message.error('登录已过期，请重新登录')
              removeToken()
              removeRefreshToken()
              window.location.href = '/login'
            })
            .finally(() => {
              isRefreshing = false
            })
        }
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`
            }
            resolve(request(originalRequest))
          })
        }) as unknown as AxiosResponse
      }
      message.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return res.data as unknown as AxiosResponse
  },
  (error) => {
    if (error.response?.status === 401) {
      message.error('登录已过期，请重新登录')
      removeToken()
      removeRefreshToken()
      window.location.href = '/login'
    } else if (error.response?.status === 403) {
      message.error('没有权限访问该资源')
    } else if (error.response?.status === 404) {
      message.error('请求的资源不存在')
    } else if (error.response?.status >= 500) {
      message.error('服务器错误，请稍后重试')
    } else if (error.message === 'Network Error') {
      message.error('网络错误，请检查网络连接')
    } else if (error.code === 'ECONNABORTED') {
      message.error('请求超时，请稍后重试')
    } else {
      message.error(error.message || '请求失败')
    }
    return Promise.reject(error)
  }
)

export default request
