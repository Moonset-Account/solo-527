import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, LoginParams } from '@/types'
import { mockUsers } from '@/mock/data'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('auth_token'))
  const user = ref<User | null>(null)

  if (token.value) {
    const savedUser = localStorage.getItem('auth_user')
    if (savedUser) {
      try {
        user.value = JSON.parse(savedUser)
      } catch {
        user.value = null
      }
    }
  }

  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const userRole = computed(() => user.value?.role || null)

  async function login(params: LoginParams) {
    await new Promise(resolve => setTimeout(resolve, 500))

    const foundUser = mockUsers.find(
      u => u.username === params.username && u.password === params.password
    )

    if (!foundUser) {
      throw new Error('用户名或密码错误')
    }

    const { password, ...safeUser } = foundUser
    const mockToken = `mock_token_${Date.now()}_${safeUser.id}`

    token.value = mockToken
    user.value = safeUser

    localStorage.setItem('auth_token', mockToken)
    localStorage.setItem('auth_user', JSON.stringify(safeUser))

    return safeUser
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
  }

  function hasRole(roles: string | string[]) {
    if (!user.value) return false
    if (Array.isArray(roles)) {
      return roles.includes(user.value.role)
    }
    return user.value.role === roles
  }

  return {
    token,
    user,
    isAuthenticated,
    userRole,
    login,
    logout,
    hasRole
  }
})
