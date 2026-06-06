import axios from 'axios'
import { message } from 'antd'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000
})

api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

api.interceptors.response.use(
  response => {
    const res = response.data
    if (Array.isArray(res)) {
      return { code: 200, message: 'success', data: res }
    }
    if (res && typeof res === 'object' && ('code' in res)) {
      if (res.code === 200 || res.code === 0) {
        return res
      }
      message.error(res.message || '请求失败')
      return Promise.reject(res)
    }
    return { code: 200, message: 'success', data: res }
  },
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    } else {
      message.error(error.response?.data?.message || error.message || '网络错误')
    }
    return Promise.reject(error)
  }
)

export const downloadFile = async (url, params = {}, filename = 'export.xlsx') => {
  const token = localStorage.getItem('token')
  try {
    const response = await api.get(url, {
      params,
      responseType: 'blob'
    })
    
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(downloadUrl)
    
    return { code: 200, message: '导出成功' }
  } catch (error) {
    message.error('导出失败')
    return Promise.reject(error)
  }
}

export default api
