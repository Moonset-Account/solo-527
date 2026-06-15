import axios from 'axios'
import type { ApiResponse, ErrorDetails } from '@/types'
import { message as antMessage } from 'antd'

const api = axios.create({
  baseURL: '/api',
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
  (response) => {
    if (response.config.responseType === 'blob') {
      return response.data
    }
    
    const data = response.data as ApiResponse<any>
    if (data && data.success !== undefined && !data.success) {
      showError(data.error)
      return Promise.reject(data)
    }
    return response.data
  },
  (error) => {
    const errorDetails: ErrorDetails = {
      errorCode: error.code || 'NETWORK_ERROR',
      errorMessage: error.message || '网络请求失败',
      nextStep: '请检查您的网络连接，然后重试。如果问题持续存在，请联系技术支持。',
      detailedDescription: '无法连接到服务器，可能是网络问题或服务器维护中。'
    }
    
    if (error.response) {
      if (error.response.status === 401) {
        errorDetails.errorCode = 'UNAUTHORIZED'
        errorDetails.errorMessage = '登录已过期，请重新登录'
        errorDetails.nextStep = '请点击登录按钮重新登录系统。'
      } else if (error.response.status === 403) {
        errorDetails.errorCode = 'FORBIDDEN'
        errorDetails.errorMessage = '您没有权限访问该资源'
        errorDetails.nextStep = '请联系管理员申请相应的访问权限。'
      } else if (error.response.status === 404) {
        errorDetails.errorCode = 'NOT_FOUND'
        errorDetails.errorMessage = '请求的资源不存在'
        errorDetails.nextStep = '请检查您访问的链接是否正确，或返回首页重新操作。'
      } else if (error.response.status >= 500) {
        errorDetails.errorCode = 'SERVER_ERROR'
        errorDetails.errorMessage = '服务器内部错误'
        errorDetails.nextStep = '请稍后重试，如果问题持续存在，请联系技术支持。'
        errorDetails.supportUrl = '/support/ticket'
      }
    }
    
    showError(errorDetails)
    return Promise.reject(errorDetails)
  }
)

function showError(error?: ErrorDetails) {
  if (!error) return
  
  let msg = error.errorMessage
  if (error.nextStep) {
    msg += `\n下一步：${error.nextStep}`
  }
  
  antMessage.error({
    content: msg,
    duration: 5,
    style: {
      whiteSpace: 'pre-line'
    }
  })
}

export default api
