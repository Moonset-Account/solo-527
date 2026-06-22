import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchInventoryOverview, fetchInventoryLogs, createInbound, createOutbound, fetchScrapRecords, type InventoryItem, type InventoryLog } from '@/api/inventory'

export const useInventoryStore = defineStore('inventory', () => {
  const items = ref<InventoryItem[]>([])
  const logs = ref<InventoryLog[]>([])
  const scraps = ref<any[]>([])
  const loading = ref(false)
  const filters = ref<Record<string, unknown>>({})

  const loadItems = async () => {
    loading.value = true
    try {
      const res: any = await fetchInventoryOverview()
      items.value = Array.isArray(res) ? res : []
    } finally {
      loading.value = false
    }
  }

  const loadLogs = async (params?: Record<string, unknown>) => {
    loading.value = true
    try {
      const res: any = await fetchInventoryLogs({ ...filters.value, ...params })
      logs.value = Array.isArray(res) ? res : []
    } finally {
      loading.value = false
    }
  }

  const loadScraps = async () => {
    try {
      const res: any = await fetchScrapRecords()
      scraps.value = Array.isArray(res) ? res : []
    } catch {}
  }

  const inbound = async (data: Partial<InventoryLog>) => {
    const res: any = await createInbound(data)
    await loadItems()
    await loadLogs()
    return res
  }

  const outbound = async (data: Partial<InventoryLog>) => {
    const res: any = await createOutbound(data)
    await loadItems()
    await loadLogs()
    return res
  }

  return { items, logs, scraps, loading, filters, loadItems, loadLogs, loadScraps, inbound, outbound }
})
