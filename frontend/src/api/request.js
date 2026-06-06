import axios from 'axios'
import { message } from 'antd'

const request = axios.create({
  baseURL: '/api',
  timeout: 30000
})

request.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

request.interceptors.response.use(
  response => {
    const data = response.data
    if (data.code === 'SUCCESS') {
      return data.data
    } else if (data.code === 'ACCESS_DENIED') {
      message.error('权限不足，请联系管理员')
      return Promise.reject(data)
    } else {
      message.error(data.message || '请求失败')
      return Promise.reject(data)
    }
  },
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    } else {
      message.error(error.response?.data?.message || '网络错误')
    }
    return Promise.reject(error)
  }
)

export default request
