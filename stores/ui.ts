export const useUiStore = defineStore('ui', () => {
  const sidebarCollapsed = ref(false)
  const activeNav = ref('contracts')
  const pageTitle = ref('合同管理')
  const showNotificationPanel = ref(false)
  const notifications = ref<any[]>([])
  const unreadCount = ref(0)

  const loading = ref(false)
  const loadingMessage = ref('加载中...')

  function setPageTitle(title: string) {
    pageTitle.value = title
  }

  function setActiveNav(nav: string) {
    activeNav.value = nav
  }

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function showLoading(msg = '加载中...') {
    loadingMessage.value = msg
    loading.value = true
  }

  function hideLoading() {
    loading.value = false
  }

  async function fetchNotifications() {
    try {
      const list: any = await $fetch('/api/reminders', {
        params: { status: 'PENDING' }
      })
      notifications.value = list || []
      unreadCount.value = notifications.value.filter((n: any) => n.status === 'PENDING').length
    } catch (e: any) {
      if (e?.status !== 401) {
        console.warn('获取通知失败', e)
      }
    }
  }

  return {
    sidebarCollapsed,
    activeNav,
    pageTitle,
    showNotificationPanel,
    notifications,
    unreadCount,
    loading,
    loadingMessage,
    setPageTitle,
    setActiveNav,
    toggleSidebar,
    showLoading,
    hideLoading,
    fetchNotifications
  }
})
