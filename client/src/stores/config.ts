import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getConfigs,
  createConfig,
  updateConfig,
  type Config,
  type ConfigListParams,
  type CreateConfigData,
  type UpdateConfigData
} from '../api/config'

export const useConfigStore = defineStore('config', () => {
  const list = ref<Config[]>([])
  const total = ref(0)
  const loading = ref(false)

  const currentUserId = 'demo-admin-001'
  const currentUserName = '管理员'

  const fetchList = async (params?: ConfigListParams) => {
    loading.value = true
    try {
      const res: any = await getConfigs(params)
      list.value = res || []
      total.value = list.value.length
    } finally {
      loading.value = false
    }
  }

  const create = async (data: Omit<CreateConfigData, 'updatedBy'>) => {
    const payload: CreateConfigData = {
      ...data,
      updatedBy: {
        userId: currentUserId,
        userName: currentUserName
      }
    }
    const res: any = await createConfig(payload)
    return res
  }

  const update = async (id: string, data: Omit<UpdateConfigData, 'updatedBy'>) => {
    const payload: UpdateConfigData = {
      ...data,
      updatedBy: {
        userId: currentUserId,
        userName: currentUserName
      }
    }
    const res: any = await updateConfig(id, payload)
    return res
  }

  return {
    list,
    total,
    loading,
    currentUserId,
    currentUserName,
    fetchList,
    create,
    update
  }
})
