import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const sidebarCollapsed = ref<boolean>(false)
  const device = ref<'desktop' | 'mobile'>('desktop')

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function setSidebarCollapsed(collapsed: boolean) {
    sidebarCollapsed.value = collapsed
  }

  function setDevice(newDevice: 'desktop' | 'mobile') {
    device.value = newDevice
  }

  return {
    sidebarCollapsed,
    device,
    toggleSidebar,
    setSidebarCollapsed,
    setDevice
  }
})
