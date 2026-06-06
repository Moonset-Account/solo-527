import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/api'

export const useUserStore = defineStore('user', () => {
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
  const token = ref(localStorage.getItem('token') || '')

  const isLoggedIn = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isLibrarian = computed(() => ['admin', 'librarian'].includes(user.value?.role))
  const isParent = computed(() => user.value?.role === 'parent')

  async function login(username, password) {
    try {
      const mockUser = {
        id: 1,
        username,
        role: username === 'admin' ? 'admin' : username === 'librarian' ? 'librarian' : 'parent',
        email: `${username}@example.com`,
        phone: '13800138000'
      }
      user.value = mockUser
      localStorage.setItem('user', JSON.stringify(mockUser))
      return mockUser
    } catch (error) {
      throw error
    }
  }

  function logout() {
    user.value = null
    token.value = ''
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }

  async function fetchCurrentUser() {
    try {
      const data = await api.accounts.me()
      user.value = data
      localStorage.setItem('user', JSON.stringify(data))
      return data
    } catch (error) {
      console.error('获取用户信息失败', error)
    }
  }

  return {
    user,
    token,
    isLoggedIn,
    isAdmin,
    isLibrarian,
    isParent,
    login,
    logout,
    fetchCurrentUser
  }
})
