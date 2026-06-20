import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getDownloadDetails,
  exportDownload,
  type DownloadDetail,
  type DownloadListParams
} from '../api/download'

export const useDownloadStore = defineStore('download', () => {
  const list = ref<DownloadDetail[]>([])
  const total = ref(0)
  const loading = ref(false)

  const fetchList = async (params?: DownloadListParams) => {
    loading.value = true
    try {
      const res: any = await getDownloadDetails(params)
      list.value = res.data || []
      total.value = res.total || 0
    } finally {
      loading.value = false
    }
  }

  const exportFile = async (params?: DownloadListParams) => {
    const res: any = await exportDownload(params)
    return res
  }

  return {
    list,
    total,
    loading,
    fetchList,
    exportFile
  }
})
