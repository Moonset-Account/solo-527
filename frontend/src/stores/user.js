import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as apiLogin, logout as apiLogout, getProfile } from '@/api/auth'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || 'null'))
  const roles = ref([])
  const permissions = ref([])

  const setToken = (val) => {
    token.value = val
    localStorage.setItem('token', val)
  }

  const setUserInfo = (val) => {
    userInfo.value = val
    localStorage.setItem('userInfo', JSON.stringify(val))
  }

  const setRoles = (val) => {
    roles.value = val
  }

  const setPermissions = (val) => {
    permissions.value = val
  }

  const hasRole = (roleNames) => {
    if (!Array.isArray(roleNames)) {
      roleNames = [roleNames]
    }
    return roleNames.some(name => roles.value.some(r => r.name === name))
  }

  const hasPermission = (permissionNames) => {
    if (!Array.isArray(permissionNames)) {
      permissionNames = [permissionNames]
    }
    return permissionNames.some(name => permissions.value.includes(name))
  }

  const isAdmin = computed(() => hasRole('admin'))

  const handleLogin = async (credentials) => {
    const res = await apiLogin(credentials)
    const tokenValue = res.token || res.data?.token
    if (tokenValue) {
      setToken(tokenValue)
    }
    const user = res.user || res.data?.user
    if (user) {
      setUserInfo(user)
    }
    return res
  }

  const fetchProfile = async () => {
    try {
      const res = await getProfile()
      const data = res.data || res
      if (data) {
        setUserInfo(data)
        if (data.roles) {
          setRoles(data.roles)
        }
      }
      return data
    } catch (e) {
      console.error('获取用户信息失败:', e)
      throw e
    }
  }

  const handleLogout = async () => {
    try {
      await apiLogout()
    } catch (e) {
      console.error('登出失败:', e)
    }
    clearUser()
  }

  const clearUser = () => {
    token.value = ''
    userInfo.value = null
    roles.value = []
    permissions.value = []
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
  }

  return {
    token,
    userInfo,
    roles,
    permissions,
    isAdmin,
    setToken,
    setUserInfo,
    setRoles,
    setPermissions,
    hasRole,
    hasPermission,
    login: handleLogin,
    logout: handleLogout,
    fetchProfile,
    clearUser
  }
})
