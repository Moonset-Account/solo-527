import axios from 'axios'
import { message } from 'antd'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

request.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API Error:', error)
    const errorMsg = error.response?.data?.message || error.message || '请求失败'
    const suggestion = error.response?.data?.suggestion
    
    let fullMessage = errorMsg
    if (suggestion) {
      fullMessage += `（建议：${suggestion}）`
    }
    
    message.error(fullMessage)
    return Promise.reject(error)
  }
)

export default request
