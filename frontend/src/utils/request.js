import axios from 'axios'
import { message } from 'antd'
import { useUserStore } from '../store/userStore'

const request = axios.create({
  baseURL: '/api',
  timeout: 30000,
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
    if (response.config.responseType === 'blob') {
      const contentType = response.headers['content-type'] || ''
      if (
        contentType.includes('application/json') &&
        response.data instanceof Blob &&
        response.data.size < 4096
      ) {
        return response.data.text().then((text) => {
          try {
            const json = JSON.parse(text)
            if (json.code !== 200) {
              message.error(json.message || '导出失败')
              return Promise.reject(new Error(json.message || '导出失败'))
            }
          } catch (e) {
            // ignore
          }
          return response.data
        })
      }
      return response.data
    }

    const data = response.data
    if (data.code === 200) {
      return data.data
    } else {
      message.error(data.message || '请求失败')
      return Promise.reject(new Error(data.message || '请求失败'))
    }
  },
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      message.error('登录已过期，请重新登录')
      useUserStore.getState().logout()
      window.location.href = '/login'
    } else {
      message.error(error.message || '网络错误')
    }
    return Promise.reject(error)
  }
)

export default request
