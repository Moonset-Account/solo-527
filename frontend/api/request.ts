import axios from 'axios'
import { useUserStore } from '~/stores/user'

const baseURL = 'http://localhost:8000/api/v1'

const request = axios.create({
  baseURL,
  timeout: 15000,
})

request.interceptors.request.use(
  (config) => {
    if (import.meta.client) {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

request.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    if (error.response?.status === 401) {
      if (import.meta.client) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error.response?.data || error)
  }
)

export default request
