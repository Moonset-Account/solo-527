import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { LoginParams, UserRole } from '@/types'
import { useMessage, useDialog } from 'naive-ui'

export function useAuth() {
  const router = useRouter()
  const authStore = useAuthStore()
  const message = useMessage()
  const dialog = useDialog()

  const token = computed(() => authStore.token)
  const user = computed(() => authStore.user)
  const isAuthenticated = computed(() => authStore.isAuthenticated)
  const userRole = computed(() => authStore.userRole)

  async function login(params: LoginParams, redirect?: string) {
    try {
      const user = await authStore.login(params)
      message.success(`欢迎回来，${user.fullName}！`)
      router.push(redirect || '/dashboard')
      return true
    } catch (e) {
      const error = e as Error
      message.error(error.message || '登录失败')
      return false
    }
  }

  function logout(showConfirm = true) {
    const doLogout = () => {
      authStore.logout()
      message.success('已安全退出登录')
      router.push({ name: 'Login' })
    }
    if (showConfirm) {
      dialog.warning({
        title: '确认退出',
        content: '您确定要退出当前账号吗？',
        positiveText: '确定退出',
        negativeText: '取消',
        onPositiveClick: doLogout
      })
    } else {
      doLogout()
    }
  }

  function hasRole(roles: UserRole | UserRole[]) {
    return authStore.hasRole(roles)
  }

  function requireRole(roles: UserRole | UserRole[]) {
    if (!hasRole(roles)) {
      message.warning('您没有访问该页面的权限')
      router.push('/dashboard')
      return false
    }
    return true
  }

  return {
    token,
    user,
    isAuthenticated,
    userRole,
    login,
    logout,
    hasRole,
    requireRole
  }
}
