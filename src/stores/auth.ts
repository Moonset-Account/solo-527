import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

interface User {
  id: number
  username: string
  displayName: string
  role: string
  email?: string
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string>(localStorage.getItem('token') || '')
  const user = ref<User | null>(null)

  const isLoggedIn = computed(() => !!token.value)
  const userRole = computed(() => user.value?.role || '')

  async function login(username: string, password: string) {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (data.success) {
        token.value = data.data.token
        user.value = data.data.user
        localStorage.setItem('token', data.data.token)
        ElMessage.success('登录成功')
        return true
      } else {
        ElMessage.error(data.error || '登录失败')
        return false
      }
    } catch {
      ElMessage.error('网络错误')
      return false
    }
  }

  async function fetchUser() {
    if (!token.value) return
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: token.value },
      })
      const data = await res.json()
      if (data.success) {
        user.value = data.data
      }
    } catch {
      // ignore
    }
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    const router = useRouter()
    router.push('/login')
  }

  return { token, user, isLoggedIn, userRole, login, fetchUser, logout }
})
