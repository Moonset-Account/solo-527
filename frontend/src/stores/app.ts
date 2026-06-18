import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const sidebarCollapsed = ref(false)
  const searchKeyword = ref('')
  const notificationCount = ref(0)

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function setNotificationCount(count: number) {
    notificationCount.value = count
  }

  return {
    sidebarCollapsed,
    searchKeyword,
    notificationCount,
    toggleSidebar,
    setNotificationCount
  }
})
