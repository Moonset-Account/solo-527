import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAppStore = defineStore('app', () => {
  const isDark = ref(false)
  const collapsed = ref(false)
  const loading = ref(false)
  const loadingText = ref('加载中...')
  const currentLocale = ref<'zh-CN' | 'en-US'>('zh-CN')

  const theme = computed(() => (isDark.value ? 'dark' : 'light'))

  function toggleDark() {
    isDark.value = !isDark.value
    localStorage.setItem('app_dark', String(isDark.value))
  }

  function toggleCollapsed() {
    collapsed.value = !collapsed.value
    localStorage.setItem('app_collapsed', String(collapsed.value))
  }

  function setLoading(value: boolean, text = '加载中...') {
    loading.value = value
    loadingText.value = text
  }

  function setLocale(locale: 'zh-CN' | 'en-US') {
    currentLocale.value = locale
    localStorage.setItem('app_locale', locale)
  }

  function restoreFromStorage() {
    const savedDark = localStorage.getItem('app_dark')
    if (savedDark !== null) {
      isDark.value = savedDark === 'true'
    }

    const savedCollapsed = localStorage.getItem('app_collapsed')
    if (savedCollapsed !== null) {
      collapsed.value = savedCollapsed === 'true'
    }

    const savedLocale = localStorage.getItem('app_locale') as 'zh-CN' | 'en-US' | null
    if (savedLocale) {
      currentLocale.value = savedLocale
    }
  }

  restoreFromStorage()

  return {
    isDark,
    collapsed,
    loading,
    loadingText,
    currentLocale,
    theme,
    toggleDark,
    toggleCollapsed,
    setLoading,
    setLocale,
    restoreFromStorage
  }
})
