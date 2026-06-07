import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types'

export const useUserStore = defineStore('user', () => {
  const currentUser = ref<User | null>(null)

  const isLoggedIn = computed(() => currentUser.value !== null)
  const role = computed(() => currentUser.value?.role || 'public')
  const isManager = computed(() => role.value === 'manager')
  const isAuditor = computed(() => role.value === 'auditor' || role.value === 'manager')

  function login(userId: string, users: User[]) {
    const user = users.find(u => u.id === userId)
    if (user) {
      currentUser.value = user
      localStorage.setItem('currentUser', JSON.stringify(user))
    }
  }

  function logout() {
    currentUser.value = null
    localStorage.removeItem('currentUser')
  }

  function restoreSession() {
    const saved = localStorage.getItem('currentUser')
    if (saved) {
      try {
        currentUser.value = JSON.parse(saved)
      } catch {
        localStorage.removeItem('currentUser')
      }
    }
  }

  function hasPermission(requiredRoles: Array<'manager' | 'auditor'>): boolean {
    if (!currentUser.value) return false
    return requiredRoles.includes(currentUser.value.role as any)
  }

  return {
    currentUser,
    isLoggedIn,
    role,
    isManager,
    isAuditor,
    login,
    logout,
    restoreSession,
    hasPermission
  }
})
