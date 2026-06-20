import axios from 'axios'
import { message } from 'antd'
import { useUserStore } from '../store/userStore'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

request.interceptors.request.use(
  (config) => {
    const token = useUserStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

request.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res.code === 200) {
      return res.data
    } else {
      message.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message || '请求失败'))
    }
  },
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        useUserStore.getState().logout()
        message.error('登录已过期，请重新登录')
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      } else if (error.response.status === 403) {
        message.error('权限不足')
      } else {
        message.error(error.response.data?.message || '请求失败')
      }
    } else {
      message.error('网络错误')
    }
    return Promise.reject(error)
  }
)

export default request
