import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface UserInfo {
  id: number
  phone: string
  nickname: string
  avatar?: string
}

export const useUserStore = defineStore('user', () => {
  const userInfo = ref<UserInfo | null>(null)
  const token = ref<string | null>(localStorage.getItem('user_token'))

  const isLoggedIn = computed(() => !!token.value)

  function setUser(user: UserInfo, userToken: string) {
    userInfo.value = user
    token.value = userToken
    localStorage.setItem('user_token', userToken)
  }

  function logout() {
    userInfo.value = null
    token.value = null
    localStorage.removeItem('user_token')
  }

  return {
    userInfo,
    token,
    isLoggedIn,
    setUser,
    logout
  }
})
