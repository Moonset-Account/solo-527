import axios from 'axios'
import { useAuthStore } from '@/store'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000
})

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = useAuthStore.getState().refreshToken
      if (refreshToken) {
        try {
          const res = await axios.post('/api/token/refresh/', { refresh: refreshToken })
          useAuthStore.getState().setAuth(
            res.data.access,
            res.data.refresh,
            useAuthStore.getState().user
          )
          error.config.headers.Authorization = `Bearer ${res.data.access}`
          return api(error.config)
        } catch (e) {
          useAuthStore.getState().logout()
          window.location.href = '/login'
        }
      } else {
        useAuthStore.getState().logout()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
