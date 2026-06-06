import type { User } from '~/types'

export const useAuth = () => {
  const user = useState<User | null>('auth-user', () => null)
  const loading = useState('auth-loading', () => false)

  const login = async (username: string, password: string) => {
    loading.value = true
    try {
      const data = await $fetch<{ user: User; token: string }>('/api/auth/login', {
        method: 'POST',
        body: { username, password }
      })
      user.value = data.user
      return data.user
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
    } catch (e) {}
    user.value = null
    await navigateTo('/login')
  }

  const fetchCurrentUser = async () => {
    try {
      const data = await $fetch<User>('/api/auth/me')
      user.value = data
      return data
    } catch (e) {
      user.value = null
      return null
    }
  }

  const hasRole = (roles: string[]) => {
    if (!user.value) return false
    return roles.includes(user.value.role)
  }

  return {
    user,
    loading,
    login,
    logout,
    fetchCurrentUser,
    hasRole
  }
}
