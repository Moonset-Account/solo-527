import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const mode = ref('station')
  const currentRoute = ref(null)
  const loading = ref(false)

  function setMode(newMode) {
    mode.value = newMode
  }

  function setLoading(value) {
    loading.value = value
  }

  function setCurrentRoute(route) {
    currentRoute.value = route
  }

  return { mode, currentRoute, loading, setMode, setLoading, setCurrentRoute }
})
