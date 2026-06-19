import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAppStore = defineStore('app', () => {
  const loading = ref(false)
  const loadingCount = ref(0)
  const sidebarCollapsed = ref(false)

  const showLoading = computed(() => loadingCount.value > 0)

  const startLoading = () => {
    loadingCount.value++
    loading.value = true
  }

  const stopLoading = () => {
    if (loadingCount.value > 0) {
      loadingCount.value--
    }
    if (loadingCount.value === 0) {
      loading.value = false
    }
  }

  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  const setSidebarCollapsed = (collapsed: boolean) => {
    sidebarCollapsed.value = collapsed
  }

  return {
    loading,
    loadingCount,
    sidebarCollapsed,
    showLoading,
    startLoading,
    stopLoading,
    toggleSidebar,
    setSidebarCollapsed,
  }
})
