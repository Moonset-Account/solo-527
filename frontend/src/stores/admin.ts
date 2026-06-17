import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface AdminInfo {
  id: number
  username: string
  nickname: string
  role: string
}

export const useAdminStore = defineStore('admin', () => {
  const adminInfo = ref<AdminInfo | null>(null)
  const token = ref<string | null>(localStorage.getItem('admin_token'))

  const isLoggedIn = computed(() => !!token.value)

  function setAdmin(admin: AdminInfo, adminToken: string) {
    adminInfo.value = admin
    token.value = adminToken
    localStorage.setItem('admin_token', adminToken)
  }

  function logout() {
    adminInfo.value = null
    token.value = null
    localStorage.removeItem('admin_token')
  }

  return {
    adminInfo,
    token,
    isLoggedIn,
    setAdmin,
    logout
  }
})
