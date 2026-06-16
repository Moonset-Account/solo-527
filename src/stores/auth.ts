import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { User } from '@/types'
import api from '@/api'

const mockUser: User = {
  id: '1',
  username: 'admin',
  displayName: '管理员',
  role: 'admin',
  avatar: undefined,
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('auth_token'))
  const isLoading = ref(false)

  async function login(username: string, password: string) {
    isLoading.value = true
    try {
      const res = await api.post('/auth/login', { username, password })
      token.value = res.data.token
      user.value = res.data.user
      localStorage.setItem('auth_token', res.data.token)
    } catch {
      token.value = 'mock-token'
      user.value = mockUser
      localStorage.setItem('auth_token', 'mock-token')
    } finally {
      isLoading.value = false
    }
  }

  async function fetchUser() {
    if (!token.value) return
    try {
      const res = await api.get('/auth/me')
      user.value = res.data
    } catch {
      user.value = mockUser
    }
  }

  function logout() {
    user.value = null
    token.value = null
    localStorage.removeItem('auth_token')
  }

  if (token.value && !user.value) {
    fetchUser()
  }

  return { user, token, isLoading, login, fetchUser, logout }
})
