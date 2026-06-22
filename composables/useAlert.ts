import type { AlertLevel, AlertStatus } from '@prisma/client'

export interface AlertItem {
  id: number
  alertNo: string
  title: string
  level: AlertLevel
  status: AlertStatus
  serverHost: string
  serverIp: string
  metric: string
  threshold: string
  currentValue: string
  description: string | null
  abnormalReason: string | null
  storeCode: string | null
  reporter: { realName: string } | null
  acknowledger: { realName: string } | null
  acknowledgedAt: string | null
  resolvedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface AlertDetail extends AlertItem {
  changeRequests: Array<{
    id: number
    changeNo: string
    title: string
    status: string
    submitter: { realName: string } | null
    createdAt: string
  }>
  operationLogs: Array<{
    id: number
    actionType: string
    note: string | null
    beforeData: unknown
    afterData: unknown
    createdAt: string
    user: { realName: string } | null
  }>
}

export const useAlert = () => {
  const list = ref<AlertItem[]>([])
  const detail = ref<AlertDetail | null>(null)
  const total = ref(0)
  const page = ref(1)
  const pageSize = ref(20)
  const loading = ref(false)

  async function fetchList(params?: Record<string, string | number | undefined>) {
    loading.value = true
    try {
      const query = new URLSearchParams()
      query.set('page', String(page.value))
      query.set('pageSize', String(pageSize.value))
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== '') query.set(k, String(v))
        })
      }
      const data = await $fetch<{ data: AlertItem[]; total: number }>(`/api/alerts?${query.toString()}`)
      list.value = data.data
      total.value = data.total
    } finally {
      loading.value = false
    }
  }

  async function fetchDetail(id: number) {
    loading.value = true
    try {
      detail.value = await $fetch<AlertDetail>(`/api/alerts/${id}`)
      return detail.value
    } finally {
      loading.value = false
    }
  }

  async function createAlert(body: Record<string, unknown>) {
    return await $fetch('/api/alerts', { method: 'POST', body })
  }

  async function acknowledge(id: number, note?: string) {
    return await $fetch(`/api/alerts/${id}/acknowledge`, { method: 'POST', body: { note } })
  }

  async function changeStatus(id: number, status: AlertStatus, note?: string, abnormalReason?: string) {
    return await $fetch(`/api/alerts/${id}/status`, {
      method: 'PATCH',
      body: { status, note, abnormalReason }
    })
  }

  function exportUrl(params?: Record<string, string>) {
    const query = new URLSearchParams(params || {})
    return `/api/alerts/export?${query.toString()}`
  }

  return {
    list,
    detail,
    total,
    page,
    pageSize,
    loading,
    fetchList,
    fetchDetail,
    createAlert,
    acknowledge,
    changeStatus,
    exportUrl
  }
}
