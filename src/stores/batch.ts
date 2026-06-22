import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchBatches, fetchBatch, createBatch, updateBatch, type Batch, type PaginatedBatches } from '@/api/batch'

export const useBatchStore = defineStore('batch', () => {
  const list = ref<Batch[]>([])
  const current = ref<Batch | null>(null)
  const total = ref(0)
  const loading = ref(false)
  const filters = ref<Record<string, unknown>>({})

  const loadList = async (params?: Record<string, unknown>) => {
    loading.value = true
    try {
      const res: any = await fetchBatches({ ...filters.value, ...params })
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
      const res: any = await fetchBatch(id)
      current.value = res
    } finally {
      loading.value = false
    }
  }

  const add = async (data: Partial<Batch>) => {
    const res: any = await createBatch(data)
    await loadList()
    return res
  }

  const edit = async (id: string, data: Partial<Batch>) => {
    const res: any = await updateBatch(id, data)
    if (current.value?._id === id) current.value = res
    return res
  }

  return { list, current, total, loading, filters, loadList, loadDetail, add, edit }
})
