import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { inspectionApi } from '~/utils/api'
import type { InspectionTask, InspectionRecord } from '~/types'

export const useInspectionsStore = defineStore('inspections', () => {
  const tasks = ref<InspectionTask[]>([])
  const total = ref(0)
  const loading = ref(false)

  const pending = computed(() => tasks.value.filter(t => t.status === 'pending'))
  const inProgress = computed(() => tasks.value.filter(t => t.status === 'in_progress'))
  const completed = computed(() => tasks.value.filter(t => t.status === 'completed'))
  const accepted = computed(() => tasks.value.filter(t => t.status === 'accepted'))

  async function fetchList(params?: Record<string, any>) {
    loading.value = true
    try {
      const res = await inspectionApi.list(params)
      tasks.value = res.items
      total.value = res.total
    } finally {
      loading.value = false
    }
  }

  async function createTask(data: Partial<InspectionTask>) {
    return inspectionApi.create(data)
  }

  async function updateStatus(id: number, status: string) {
    return inspectionApi.updateStatus(id, { status })
  }

  async function submitRecord(id: number, data: Partial<InspectionRecord>) {
    return inspectionApi.submitRecord(id, data)
  }

  return { tasks, total, loading, pending, inProgress, completed, accepted, fetchList, createTask, updateStatus, submitRecord }
})
