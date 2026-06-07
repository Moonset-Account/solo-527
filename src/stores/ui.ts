import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  const sidebarCollapsed = ref(false)
  const currentPageTitle = ref('仪表盘')

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function setPageTitle(title: string) {
    currentPageTitle.value = title
  }

  return {
    sidebarCollapsed,
    currentPageTitle,
    toggleSidebar,
    setPageTitle
  }
})
