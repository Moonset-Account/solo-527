import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Order } from '@/api/order'
import { getOrderList } from '@/api/order'

export const useOrderStore = defineStore('order', () => {
  const orders = ref<Order[]>([])
  const total = ref(0)
  const loading = ref(false)

  async function fetchOrders(params: any = {}) {
    loading.value = true
    try {
      const res = await getOrderList(params)
      orders.value = res.data.list || []
      total.value = res.data.total || 0
      return res
    } finally {
      loading.value = false
    }
  }

  return {
    orders,
    total,
    loading,
    fetchOrders
  }
})
