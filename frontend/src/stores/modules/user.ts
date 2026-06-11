import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface UserInfo {
  id: number | null
  username: string
  nickname: string
  avatar: string
  roles: string[]
}

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(localStorage.getItem('token') || '')
  const userInfo = ref<UserInfo>({
    id: null,
    username: '',
    nickname: '',
    avatar: '',
    roles: []
  })

  const isLoggedIn = computed(() => !!token.value)

  function setToken(newToken: string) {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  function setUserInfo(info: Partial<UserInfo>) {
    userInfo.value = { ...userInfo.value, ...info }
  }

  function logout() {
    token.value = ''
    userInfo.value = {
      id: null,
      username: '',
      nickname: '',
      avatar: '',
      roles: []
    }
    localStorage.removeItem('token')
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    setToken,
    setUserInfo,
    logout
  }
})
