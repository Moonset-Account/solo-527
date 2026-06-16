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
    if (roleType === 'GENERAL_OFFICE') return true
    if (roleType === 'ADMIN') {
      const adminRestricted = ['delete_role', 'manage_general_manager']
      return !adminRestricted.includes(action)
    }
    return false
  }

  function setUser(user) {
    currentUser.value = { ...user }
    localStorage.setItem('userId', user.id || '1')
    localStorage.setItem('userName', user.name || '')
    localStorage.setItem('userRole', user.roleType || 'ADMIN')
  }

  function clearUser() {
    currentUser.value = { id: null, name: '', roleType: '', department: '' }
    localStorage.removeItem('userId')
    localStorage.removeItem('userName')
    localStorage.removeItem('userRole')
  }

  function initUser() {
    const userId = localStorage.getItem('userId')
    const userName = localStorage.getItem('userName')
    const userRole = localStorage.getItem('userRole')
    if (userId || userRole) {
      currentUser.value = {
        id: userId || '1',
        name: userName || '',
        roleType: userRole || 'ADMIN',
        department: ''
      }
    }
  }

  return { currentUser, hasPermission, setUser, clearUser, initUser }
})
