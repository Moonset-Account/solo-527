import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

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
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response

      if (status === 401) {
        localStorage.removeItem('token')
        ElMessage.error(data.message || '登录已过期，请重新登录')
        router.push('/login')
      } else if (status === 403) {
        ElMessage.error(data.message || '权限不足')
      } else if (status === 422) {
        const errors = data.errors || []
        const firstError = errors[0]?.message || data.message || '数据验证失败'
        ElMessage.error(firstError)
      } else {
        ElMessage.error(data.message || '请求失败')
      }
    } else if (error.request) {
      ElMessage.error('网络错误，请检查网络连接')
    } else {
      ElMessage.error('请求出错')
    }

    return Promise.reject(error)
  }
)

export default api
