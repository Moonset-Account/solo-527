import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  const currentUser = ref({
    id: null,
    name: '',
    roleType: '',
    department: ''
  })

  function hasPermission(action) {
    const roleType = currentUser.value.roleType
    if (roleType === 'GENERAL_MANAGER') return true
    if (roleType === 'ADMIN') {
      const adminRestricted = ['delete_role', 'manage_general_manager']
      return !adminRestricted.includes(action)
    }
    return false
  }

  function setUser(user) {
    currentUser.value = { ...user }
  }

  function clearUser() {
    currentUser.value = { id: null, name: '', roleType: '', department: '' }
  }

  return { currentUser, hasPermission, setUser, clearUser }
})
