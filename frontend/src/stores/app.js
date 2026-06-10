import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const sidebarCollapsed = ref(false)
  const settings = ref({})

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function setSettings(newSettings) {
    settings.value = { ...settings.value, ...newSettings }
  }

  return {
    sidebarCollapsed,
    settings,
    toggleSidebar,
    setSettings,
  }
}, {
  persist: {
    paths: ['sidebarCollapsed'],
  },
})
