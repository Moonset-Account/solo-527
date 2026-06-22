import axios from 'axios'
import { useAppStore } from '@/stores/app'

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const appStore = useAppStore()
  if (appStore.sandboxMode) {
    config.headers['x-sandbox-mode'] = 'true'
  }
  return config
})

api.interceptors.response.use(
  (response) => {
    const data = response.data
    if (data && typeof data === 'object' && 'success' in data && typeof data.success === 'boolean') {
      return data.data
    }
    return data
  },
  (error) => {
    const message = error.response?.data?.message || error.message || '请求失败'
    console.error('[API Error]', message)
    return Promise.reject(error)
  },
)

export default api
