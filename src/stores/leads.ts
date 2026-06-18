import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Lead, LeadStatus, PaginatedResponse } from '@/types'
import { leadsApi } from '@/api'

export const useLeadsStore = defineStore('leads', () => {
  const list = ref<Lead[]>([])
  const total = ref(0)
  const page = ref(1)
  const pageSize = ref(20)
  const loading = ref(false)
  const selectedLead = ref<Lead | null>(null)

  const filters = ref<{
    status?: LeadStatus
    source?: string
    assignee?: number
    dateRange?: [string, string]
  }>({})

  const stats = ref({
    total: 0,
    newThisWeek: 0,
    conversionRate: 0,
    avgResponseTime: 0,
  })

  async function fetchList() {
    loading.value = true
    try {
      const params: Record<string, unknown> = {
        page: page.value,
        pageSize: pageSize.value,
        ...filters.value,
      }
      if (filters.value.dateRange) {
        params.startDate = filters.value.dateRange[0]
        params.endDate = filters.value.dateRange[1]
        delete params.dateRange
      }
      const { data } = await leadsApi.list(params)
      list.value = data.list
      total.value = data.total
    } finally {
      loading.value = false
    }
  }

  async function fetchStats() {
    const { data } = await leadsApi.stats()
    stats.value = data
  }

  async function fetchDetail(id: number) {
    const { data } = await leadsApi.detail(id)
    selectedLead.value = data
  }

  async function changeStatus(id: number, status: LeadStatus) {
    await leadsApi.changeStatus(id, status)
    if (selectedLead.value?.id === id) {
      selectedLead.value.status = status
    }
  }

  async function assignLead(id: number, userId: number) {
    await leadsApi.assign(id, userId)
  }

  async function addTag(id: number, tagId: number) {
    await leadsApi.addTag(id, tagId)
  }

  function setFilters(newFilters: typeof filters.value) {
    filters.value = newFilters
    page.value = 1
  }

  function setPage(p: number) {
    page.value = p
  }

  return {
    list, total, page, pageSize, loading, selectedLead, filters, stats,
    fetchList, fetchStats, fetchDetail, changeStatus, assignLead, addTag,
    setFilters, setPage,
  }
})
