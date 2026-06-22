import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchSchedules, fetchSchedule, createSchedule, updateSchedule, deleteSchedule, type Schedule } from '@/api/schedule'

export const useScheduleStore = defineStore('schedule', () => {
  const list = ref<Schedule[]>([])
  const current = ref<Schedule | null>(null)
  const total = ref(0)
  const loading = ref(false)
  const filters = ref<Record<string, unknown>>({})

  const loadList = async (params?: Record<string, unknown>) => {
    loading.value = true
    try {
      const res: any = await fetchSchedules({ ...filters.value, ...params })
      if (res && res.items) {
        list.value = res.items
        total.value = res.total
      } else if (Array.isArray(res)) {
        list.value = res
      }
    } finally {
      loading.value = false
    }
  }

  const loadDetail = async (id: string) => {
    loading.value = true
    try {
      const res: any = await fetchSchedule(id)
      current.value = res
    } finally {
      loading.value = false
    }
  }

  const add = async (data: Partial<Schedule>) => {
    const res: any = await createSchedule(data)
    await loadList()
    return res
  }

  const edit = async (id: string, data: Partial<Schedule>) => {
    const res: any = await updateSchedule(id, data)
    if (current.value?._id === id) current.value = res
    return res
  }

  const remove = async (id: string) => {
    await deleteSchedule(id)
    await loadList()
  }

  return { list, current, total, loading, filters, loadList, loadDetail, add, edit, remove }
})
