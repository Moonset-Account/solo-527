export function useApi() {
  const config = useRuntimeConfig()
  const baseURL = config.public.API_BASE as string

  function getHeaders(): Record<string, string> {
    const token = useCookie('token').value
    if (token) {
      return { Authorization: `Bearer ${token}` }
    }
    return {}
  }

  async function login(username: string, password: string) {
    return await $fetch<{ access_token: string; token_type: string }>(`${baseURL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ username, password })
    })
  }

  async function register(data: Record<string, string>) {
    return await $fetch(`${baseURL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: data
    })
  }

  async function getMe() {
    return await $fetch(`${baseURL}/api/auth/me`, {
      headers: getHeaders()
    })
  }

  async function createRepair(formData: FormData) {
    const headers = getHeaders()
    return await $fetch(`${baseURL}/api/repairs/`, {
      method: 'POST',
      headers,
      body: formData
    })
  }

  async function getRepairs(params?: Record<string, any>) {
    return await $fetch(`${baseURL}/api/repairs/`, {
      headers: getHeaders(),
      params
    })
  }

  async function getRepairDetail(id: string | number) {
    return await $fetch(`${baseURL}/api/repairs/${id}`, {
      headers: getHeaders()
    })
  }

  async function uploadAttachment(orderId: string | number, file: File) {
    const formData = new FormData()
    formData.append('files', file)
    return await $fetch(`${baseURL}/api/repairs/${orderId}/upload`, {
      method: 'POST',
      headers: getHeaders(),
      body: formData
    })
  }

  async function getMyNotifications(params?: Record<string, any>) {
    return await $fetch(`${baseURL}/api/repairs/notifications`, {
      headers: getHeaders(),
      params
    })
  }

  async function getActivities(params?: Record<string, any>) {
    return await $fetch(`${baseURL}/api/repairs/activities`, {
      headers: getHeaders(),
      params
    })
  }

  async function getTrades(params?: Record<string, any>) {
    return await $fetch(`${baseURL}/api/repairs/trades`, {
      headers: getHeaders(),
      params
    })
  }

  async function getMySeatViolations(params?: Record<string, any>) {
    return await $fetch(`${baseURL}/api/repairs/seat-violations`, {
      headers: getHeaders(),
      params
    })
  }

  async function getAdminRepairs(params?: Record<string, any>) {
    return await $fetch(`${baseURL}/api/admin/repairs`, {
      headers: getHeaders(),
      params
    })
  }

  async function auditRepair(orderId: string | number, action: string, comment: string) {
    return await $fetch(`${baseURL}/api/admin/repairs/${orderId}/audit`, {
      method: 'POST',
      headers: { ...getHeaders(), 'Content-Type': 'application/json' },
      body: { action, comment }
    })
  }

  async function getRepairHistory(orderId: string | number) {
    return await $fetch(`${baseURL}/api/admin/repairs/${orderId}/history`, {
      headers: getHeaders()
    })
  }

  async function getNotifications(params?: Record<string, any>) {
    return await $fetch(`${baseURL}/api/admin/notifications`, {
      headers: getHeaders(),
      params
    })
  }

  async function getClubActivities(params?: Record<string, any>) {
    return await $fetch(`${baseURL}/api/admin/club-activities`, {
      headers: getHeaders(),
      params
    })
  }

  async function getSecondHandTrades(params?: Record<string, any>) {
    return await $fetch(`${baseURL}/api/admin/second-hand`, {
      headers: getHeaders(),
      params
    })
  }

  async function getSeatViolations(params?: Record<string, any>) {
    return await $fetch(`${baseURL}/api/admin/seat-violations`, {
      headers: getHeaders(),
      params
    })
  }

  async function getStatistics() {
    return await $fetch(`${baseURL}/api/admin/statistics`, {
      headers: getHeaders()
    })
  }

  async function triggerExport(filterParams?: Record<string, any>) {
    return await $fetch(`${baseURL}/api/export/sync`, {
      method: 'POST',
      headers: { ...getHeaders(), 'Content-Type': 'application/json' },
      body: filterParams
    })
  }

  async function getExportStatus(id: string | number) {
    return await $fetch(`${baseURL}/api/export/${id}`, {
      headers: getHeaders()
    })
  }

  async function getExportHistory(params?: Record<string, any>) {
    return await $fetch(`${baseURL}/api/export/`, {
      headers: getHeaders(),
      params
    })
  }

  function getExportDownloadUrl(id: string | number): string {
    return `${baseURL}/api/export/${id}/download`
  }

  async function downloadExport(id: string | number): Promise<void> {
    const token = useCookie('token').value
    const url = getExportDownloadUrl(id)
    const response = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!response.ok) {
      throw new Error(`下载失败: ${response.status}`)
    }
    const blob = await response.blob()
    const blobUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = blobUrl
    const contentDisposition = response.headers.get('Content-Disposition')
    let filename = `export_${id}.xlsx`
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?([^"]+)"?/)
      if (match) filename = match[1]
    }
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(blobUrl)
  }

  return {
    baseURL,
    login,
    register,
    getMe,
    createRepair,
    getRepairs,
    getRepairDetail,
    uploadAttachment,
    getMyNotifications,
    getActivities,
    getTrades,
    getMySeatViolations,
    getAdminRepairs,
    auditRepair,
    getRepairHistory,
    getNotifications,
    getClubActivities,
    getSecondHandTrades,
    getSeatViolations,
    getStatistics,
    triggerExport,
    getExportStatus,
    getExportHistory,
    getExportDownloadUrl,
    downloadExport,
  }
}
