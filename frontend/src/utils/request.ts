import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

const service: AxiosInstance = axios.create({
  baseURL: '/api/v1',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

service.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    if (authStore.token) {
      config.headers['access-token'] = authStore.token
      config.headers['client'] = authStore.client
      config.headers['uid'] = authStore.uid
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

service.interceptors.response.use(
  (response: AxiosResponse) => {
    const token = response.headers['access-token']
    if (token) {
      const authStore = useAuthStore()
      authStore.setAuthInfo({
        token,
        client: response.headers['client'],
        uid: response.headers['uid']
      })
    }
    return response.data
  },
  (error) => {
    const status = error.response?.status
    const message = error.response?.data?.error || error.message

    if (status === 401) {
      const authStore = useAuthStore()
      authStore.logout()
      ElMessage.error('登录已过期，请重新登录')
      window.location.href = '/login'
    } else if (status === 403) {
      ElMessage.error('没有权限执行此操作')
    } else if (status === 404) {
      ElMessage.error('请求的资源不存在')
    } else if (status === 422) {
      const errors = error.response?.data?.errors || error.response?.data?.error
      if (Array.isArray(errors)) {
        errors.forEach((err: string) => ElMessage.error(err))
      } else {
        ElMessage.error(errors || '请求参数错误')
      }
    } else {
      ElMessage.error(message || '网络错误，请稍后重试')
    }

    return Promise.reject(error)
  }
)

export default service
