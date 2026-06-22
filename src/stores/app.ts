import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const sidebarCollapsed = ref(false)
  const sandboxMode = ref(false)

  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  const toggleSandbox = () => {
    sandboxMode.value = !sandboxMode.value
  }

  return { sidebarCollapsed, sandboxMode, toggleSidebar, toggleSandbox }
})
