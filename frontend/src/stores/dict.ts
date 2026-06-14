import { defineStore } from 'pinia'
import { ref } from 'vue'
import { configApi } from '@/api/modules'

export const useDictStore = defineStore('dict', () => {
  const statusDict = ref<Record<string, any[]>>({})
  const reminderConfigs = ref<any[]>([])
  const dictTypes = ref<string[]>([])
  const loaded = ref(false)

  const loadAll = async () => {
    try {
      const res: any = await configApi.getAll()
      statusDict.value = res.data.statusDict || {}
      reminderConfigs.value = res.data.reminderConfigs || []
      dictTypes.value = res.data.dictTypes || []
      loaded.value = true
    } catch (e) {
      console.error('加载字典失败', e)
    }
  }

  const getDict = (type: string) => {
    return statusDict.value[type] || []
  }

  const getDictLabel = (type: string, key: string) => {
    const item = statusDict.value[type]?.find(i => i.key === key || i.value === key)
    return item?.label || key
  }

  const getDictColor = (type: string, key: string) => {
    const item = statusDict.value[type]?.find(i => i.key === key || i.value === key)
    return item?.color || '#909399'
  }

  const refresh = async () => {
    loaded.value = false
    await loadAll()
  }

  return {
    statusDict,
    reminderConfigs,
    dictTypes,
    loaded,
    loadAll,
    getDict,
    getDictLabel,
    getDictColor,
    refresh
  }
}, {
  persist: {
    key: 'qinghe_dict',
    paths: ['statusDict', 'reminderConfigs', 'dictTypes']
  }
})
