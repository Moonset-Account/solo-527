import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || 'null'))

  function setLogin(data) {
    token.value = data.token
    userInfo.value = data.userInfo
    localStorage.setItem('token', data.token)
    localStorage.setItem('userInfo', JSON.stringify(data.userInfo))
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
  }

  function isLoggedIn() {
    return !!token.value
  }

  function hasRole(roleCode) {
    if (!userInfo.value) return false
    return userInfo.value.role === roleCode
  }

  return {
    token,
    userInfo,
    setLogin,
    logout,
    isLoggedIn,
    hasRole
  }
})
