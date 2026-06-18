import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Followup, FollowupCalendarEvent } from '@/types'
import { followupsApi } from '@/api'

export const useFollowupsStore = defineStore('followups', () => {
  const list = ref<Followup[]>([])
  const total = ref(0)
  const page = ref(1)
  const pageSize = ref(20)
  const loading = ref(false)
  const calendarEvents = ref<FollowupCalendarEvent[]>([])

  async function fetchList(params?: Record<string, unknown>) {
    loading.value = true
    try {
      const { data } = await followupsApi.list({ page: page.value, pageSize: pageSize.value, ...params })
      list.value = data.list
      total.value = data.total
    } finally {
      loading.value = false
    }
  }

  async function fetchCalendar(month: string) {
    const { data } = await followupsApi.calendar(month)
    calendarEvents.value = data
  }

  async function completeFollowup(id: number, result: string, nextDate?: string) {
    await followupsApi.complete(id, { result, nextFollowupDate: nextDate })
  }

  async function createFollowup(data: Partial<Followup>) {
    await followupsApi.create(data)
  }

  return {
    list, total, page, pageSize, loading, calendarEvents,
    fetchList, fetchCalendar, completeFollowup, createFollowup,
  }
})
