import type { Role } from '@prisma/client'

export interface AuthUser {
  id: number
  username: string
  realName: string
  role: Role
  storeCode: string | null
}

export const useAuth = () => {
  const user = useState<AuthUser | null>('auth-user', () => null)
  const token = useState<string | null>('auth-token', () => null)
  const isLoading = useState('auth-loading', () => false)

  const isLoggedIn = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === 'ADMIN')
  const isStoreOperator = computed(() => user.value?.role === 'STORE_OPERATOR')

  async function fetchUser() {
    try {
      isLoading.value = true
      const { data } = await useFetch<{ user: AuthUser | null }>('/api/auth/me')
      user.value = data.value?.user || null
      return user.value
    } catch {
      user.value = null
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function login(username: string, password: string) {
    isLoading.value = true
    try {
      const { data, error } = await useFetch<{ token: string; user: AuthUser }>('/api/auth/login', {
        method: 'POST',
        body: { username, password }
      })
      if (error.value) {
        throw new Error(error.value.data?.statusMessage || '登录失败')
      }
      token.value = data.value?.token || null
      user.value = data.value?.user || null
      return user.value
    } finally {
      isLoading.value = false
    }
  }

  async function logout() {
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // ignore
    }
    user.value = null
    token.value = null
    await navigateTo('/login')
  }

  function hasRole(...roles: Role[]): boolean {
    if (!user.value) return false
    return roles.includes(user.value.role)
  }

  return {
    user,
    token,
    isLoading,
    isLoggedIn,
    isAdmin,
    isStoreOperator,
    fetchUser,
    login,
    logout,
    hasRole
  }
}
