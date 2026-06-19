import { ref, computed, onMounted } from 'vue'

interface User {
  id: number
  username: string
  real_name: string
  role: string
  is_active: boolean
}

const token = ref<string | null>(null)
const user = ref<User | null>(null)
const isInitialized = ref(false)
const isAuthenticated = computed(() => !!token.value)

export function useAuth() {
  const config = useRuntimeConfig()

  if (process.client && !isInitialized.value) {
    const storedToken = localStorage.getItem('token')
    if (storedToken) {
      token.value = storedToken
    }
    isInitialized.value = true
  }

  async function initAuth() {
    if (process.client) {
      const storedToken = localStorage.getItem('token')
      if (storedToken) {
        token.value = storedToken
        await fetchUserInfo()
      }
    }
  }

  async function login(username: string, password: string) {
    try {
      const response = await $fetch<{ access_token: string; token_type: string }>('/api/auth/login', {
        method: 'POST',
        body: { username, password }
      })

      token.value = response.access_token
      if (process.client) {
        localStorage.setItem('token', response.access_token)
      }

      await fetchUserInfo()
      return true
    } catch (error: any) {
      throw new Error(error.data?.detail || '登录失败')
    }
  }

  async function fetchUserInfo() {
    if (!token.value) return

    try {
      const userData = await $fetch<User>('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token.value}`
        }
      })
      user.value = userData
    } catch (error) {
      logout()
    }
  }

  function logout() {
    token.value = null
    user.value = null
    if (process.client) {
      localStorage.removeItem('token')
    }
    navigateTo('/login')
  }

  function getAuthHeaders() {
    return token.value ? { 'Authorization': `Bearer ${token.value}` } : {}
  }

  async function apiRequest<T>(url: string, options: any = {}): Promise<T> {
    const headers = {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
      ...options.headers
    }

    try {
      return await $fetch<T>(url, {
        ...options,
        headers
      })
    } catch (error: any) {
      if (error.response?.status === 401) {
        logout()
      }
      throw error
    }
  }

  async function downloadFile(url: string, filename: string) {
    if (process.client) {
      const response = await fetch(url.startsWith('http') ? url : `${config.public.apiBase}${url}`, {
        headers: getAuthHeaders()
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || '下载失败')
      }

      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
    }
  }

  return {
    token,
    user,
    isAuthenticated,
    isInitialized,
    login,
    logout,
    fetchUserInfo,
    initAuth,
    getAuthHeaders,
    apiRequest,
    downloadFile
  }
}
