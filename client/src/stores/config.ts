import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getConfigs,
  createConfig,
  updateConfig,
  type Config,
  type ConfigListParams
} from '../api/config'

export const useConfigStore = defineStore('config', () => {
  const list = ref<Config[]>([])
  const total = ref(0)
  const loading = ref(false)

  const fetchList = async (params?: ConfigListParams) => {
    loading.value = true
    try {
      const res: any = await getConfigs(params)
      list.value = res.data?.items || res.items || []
      total.value = res.data?.total || res.total || 0
    } finally {
      loading.value = false
    }
  }

  const create = async (data: Partial<Config>) => {
    const res: any = await createConfig(data)
    return res.data || res
  }

  const update = async (id: string, data: Partial<Config>) => {
    const res: any = await updateConfig(id, data)
    return res.data || res
  }

  return {
    list,
    total,
    loading,
    fetchList,
    create,
    update
  }
})
