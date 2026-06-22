import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchAnomalies, fetchAnomaly, createAnomaly, updateAnomaly, assignResponsible, setHandlingPlan, updateAnomalyStatus, detectAnomalies, type Anomaly } from '@/api/anomaly'

export const useAnomalyStore = defineStore('anomaly', () => {
  const list = ref<Anomaly[]>([])
  const current = ref<Anomaly | null>(null)
  const loading = ref(false)
  const filters = ref<Record<string, unknown>>({})

  const loadList = async (params?: Record<string, unknown>) => {
    loading.value = true
    try {
      const res: any = await fetchAnomalies({ ...filters.value, ...params })
      list.value = Array.isArray(res) ? res : []
    } finally {
      loading.value = false
    }
  }

  const loadDetail = async (id: string) => {
    loading.value = true
    try {
      const res: any = await fetchAnomaly(id)
      current.value = res
    } finally {
      loading.value = false
    }
  }

  const add = async (data: Partial<Anomaly>) => {
    const res: any = await createAnomaly(data)
    await loadList()
    return res
  }

  const edit = async (id: string, data: Partial<Anomaly>) => {
    const res: any = await updateAnomaly(id, data)
    if (current.value?._id === id) current.value = res
    return res
  }

  const assign = async (id: string, person: string) => {
    const res: any = await assignResponsible(id, person)
    if (current.value?._id === id) current.value = res
    return res
  }

  const plan = async (id: string, handlingPlan: string) => {
    const res: any = await setHandlingPlan(id, handlingPlan)
    if (current.value?._id === id) current.value = res
    return res
  }

  const changeStatus = async (id: string, status: string) => {
    const res: any = await updateAnomalyStatus(id, status)
    if (current.value?._id === id) current.value = res
    return res
  }

  const detect = async () => {
    const res: any = await detectAnomalies()
    await loadList()
    return res
  }

  return { list, current, loading, filters, loadList, loadDetail, add, edit, assign, plan, changeStatus, detect }
})
