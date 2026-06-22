import type { ApprovalStatus } from '@prisma/client'

export interface ChangeItem {
  id: number
  changeNo: string
  title: string
  type: string
  status: ApprovalStatus
  abnormalReason: string | null
  alert: { id: number; alertNo: string; title: string; level: string; status: string } | null
  submitter: { realName: string } | null
  approver: { realName: string } | null
  submittedAt: string
  approvedAt: string | null
  windowStart: string | null
  windowEnd: string | null
  windowOpenedAt: string | null
  windowClosedAt: string | null
  completedAt: string | null
  createdAt: string
}

export interface ChangeDetail extends ChangeItem {
  description: string
  impactScope: string
  changePlan: string
  rollbackPlan: string
  approvalNote: string | null
  rolledBackAt: string | null
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

export const useChange = () => {
  const list = ref<ChangeItem[]>([])
  const detail = ref<ChangeDetail | null>(null)
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
      const data = await $fetch<{ data: ChangeItem[]; total: number }>(`/api/changes?${query.toString()}`)
      list.value = data.data
      total.value = data.total
    } finally {
      loading.value = false
    }
  }

  async function fetchDetail(id: number) {
    loading.value = true
    try {
      detail.value = await $fetch<ChangeDetail>(`/api/changes/${id}`)
      return detail.value
    } finally {
      loading.value = false
    }
  }

  async function createChange(body: Record<string, unknown>) {
    return await $fetch('/api/changes', { method: 'POST', body })
  }

  async function approve(id: number, approved: boolean, approvalNote?: string) {
    return await $fetch(`/api/changes/${id}/approve`, { method: 'POST', body: { approved, approvalNote } })
  }

  async function openWindow(id: number) {
    return await $fetch(`/api/changes/${id}/window.open`, { method: 'POST' })
  }

  async function closeWindow(id: number, note?: string) {
    return await $fetch(`/api/changes/${id}/window.close`, { method: 'POST', body: { note } })
  }

  async function rollback(id: number, note?: string) {
    return await $fetch(`/api/changes/${id}/rollback`, { method: 'POST', body: { note } })
  }

  async function markAbnormal(id: number, reason: string) {
    return await $fetch(`/api/changes/${id}/abnormal`, { method: 'POST', body: { reason } })
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
    createChange,
    approve,
    openWindow,
    closeWindow,
    rollback,
    markAbnormal
  }
}
