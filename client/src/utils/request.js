import axios from 'axios'
import { message } from 'antd'
import { getToken, removeToken } from './auth'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

request.interceptors.request.use(
  (config) => {
    const token = getToken()
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
    const { data } = response
    if (data && data.code !== 0 && data.code !== 200) {
      message.error(data.message || '请求失败')
      return Promise.reject(data)
    }
    return data
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response
      if (status === 401) {
        removeToken()
        message.error('登录已过期，请重新登录')
        window.location.href = '/login'
      } else if (status === 403) {
        message.error('没有权限访问')
      } else if (status === 404) {
        message.error('请求的资源不存在')
      } else if (status === 500) {
        message.error('服务器错误')
      } else {
        message.error(data?.message || error.message)
      }
    } else {
      message.error('网络错误，请检查网络连接')
    }
    return Promise.reject(error)
  }
)

export default request
