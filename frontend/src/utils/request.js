import axios from 'axios'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { showToast } from 'vant'
import { isMobileDevice } from './device'

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'

const api = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const userStore = useUserStore()
    const status = error.response?.status
    const message = error.response?.data?.detail || error.response?.data?.error || '请求失败'

    if (status === 401) {
      userStore.logout()
      if (isMobileDevice()) {
        showToast('登录已过期，请重新登录')
      } else {
        ElMessage.error('登录已过期，请重新登录')
      }
      window.location.href = '/login'
    } else if (status === 403) {
      if (isMobileDevice()) {
        showToast('无权限操作')
      } else {
        ElMessage.error('无权限操作')
      }
    } else if (status === 404) {
      if (isMobileDevice()) {
        showToast('资源不存在')
      } else {
        ElMessage.error('资源不存在')
      }
    } else if (status >= 500) {
      if (isMobileDevice()) {
        showToast('服务器错误，请稍后重试')
      } else {
        ElMessage.error('服务器错误，请稍后重试')
      }
    } else if (isMobileDevice()) {
      showToast(message)
    }

    return Promise.reject(error)
  }
)

export { api }
