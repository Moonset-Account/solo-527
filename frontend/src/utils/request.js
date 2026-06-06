import axios from 'axios'
import { ElMessage } from 'element-plus'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
  withCredentials: true
})

request.interceptors.request.use(
  config => {
    return config
  },
  error => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

request.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    console.error('Response error:', error)
    if (error.response) {
      const { status, data } = error.response
      if (status === 401) {
        ElMessage.error('请先登录')
      } else if (status === 403) {
        ElMessage.error('没有权限执行此操作')
      } else if (status === 400) {
        ElMessage.error(data?.error || data?.message || '请求参数错误')
      } else if (status === 500) {
        ElMessage.error('服务器内部错误')
      } else {
        ElMessage.error(data?.error || '请求失败')
      }
    } else {
      ElMessage.error('网络错误，请检查连接')
    }
    return Promise.reject(error)
  }
)

export default request
