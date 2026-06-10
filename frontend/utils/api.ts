import axios from 'axios'
import type { User } from '~/types'

const baseURL = process.env.API_BASE_URL || 'http://localhost:8000/api/v1'

const api = axios.create({
  baseURL,
  timeout: 15000,
})

api.interceptors.request.use(
  (config) => {
    if (process.client) {
      const token = localStorage.getItem('access_token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (process.client) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api

export function getToken(): string | null {
  if (process.client) {
    return localStorage.getItem('access_token')
  }
  return null
}

export function setToken(token: string): void {
  if (process.client) {
    localStorage.setItem('access_token', token)
  }
}

export function removeToken(): void {
  if (process.client) {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
  }
}

export function getStoredUser(): User | null {
  if (process.client) {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      return JSON.parse(userStr)
    }
  }
  return null
}

export function setStoredUser(user: User): void {
  if (process.client) {
    localStorage.setItem('user', JSON.stringify(user))
  }
}
