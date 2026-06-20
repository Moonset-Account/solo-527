import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getReports,
  createReport,
  updateReport,
  type Report,
  type ReportListParams
} from '../api/report'

export const useReportStore = defineStore('report', () => {
  const list = ref<Report[]>([])
  const total = ref(0)
  const loading = ref(false)

  const fetchList = async (params?: ReportListParams) => {
    loading.value = true
    try {
      const res: any = await getReports(params)
      list.value = res.data?.items || res.items || []
      total.value = res.data?.total || res.total || 0
    } finally {
      loading.value = false
    }
  }

  const create = async (data: Partial<Report>) => {
    const res: any = await createReport(data)
    return res.data || res
  }

  const update = async (id: string, data: Partial<Report>) => {
    const res: any = await updateReport(id, data)
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
