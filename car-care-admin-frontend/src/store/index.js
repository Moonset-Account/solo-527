import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const token = ref('')
  const userInfo = ref({})

  const setToken = (val) => {
    token.value = val
  }

  const setUserInfo = (val) => {
    userInfo.value = val
  }

  const clearInfo = () => {
    token.value = ''
    userInfo.value = {}
  }

  return {
    token,
    userInfo,
    setToken,
    setUserInfo,
    clearInfo
  }
})
