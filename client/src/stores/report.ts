import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getReports,
  createReport,
  updateReport,
  type Report,
  type ReportListParams,
  type CreateReportData,
  type UpdateReportData
} from '../api/report'

export const useReportStore = defineStore('report', () => {
  const list = ref<Report[]>([])
  const total = ref(0)
  const loading = ref(false)

  const fetchList = async (params?: ReportListParams) => {
    loading.value = true
    try {
      const res: any = await getReports(params)
      list.value = res.data || []
      total.value = res.total || 0
    } finally {
      loading.value = false
    }
  }

  const create = async (data: CreateReportData) => {
    const res: any = await createReport(data)
    return res
  }

  const update = async (id: string, data: UpdateReportData) => {
    const res: any = await updateReport(id, data)
    return res
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
