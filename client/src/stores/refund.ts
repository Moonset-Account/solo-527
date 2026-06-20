import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getRefunds,
  createRefund,
  updateRefund,
  type Refund,
  type RefundListParams
} from '../api/refund'

export const useRefundStore = defineStore('refund', () => {
  const list = ref<Refund[]>([])
  const total = ref(0)
  const loading = ref(false)

  const fetchList = async (params?: RefundListParams) => {
    loading.value = true
    try {
      const res: any = await getRefunds(params)
      list.value = res.data?.items || res.items || []
      total.value = res.data?.total || res.total || 0
    } finally {
      loading.value = false
    }
  }

  const create = async (data: Partial<Refund>) => {
    const res: any = await createRefund(data)
    return res.data || res
  }

  const update = async (id: string, data: Partial<Refund>) => {
    const res: any = await updateRefund(id, data)
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
