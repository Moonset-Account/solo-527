import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getOrderList } from '../api/order'
import { getStats } from '../api/dashboard'

export const useOrderStore = defineStore('order', () => {
  const orders = ref([])
  const currentOrder = ref(null)
  const loading = ref(false)
  const total = ref(0)

  const pendingOrders = computed(() => orders.value.filter(o => o.status === 'PENDING'))
  const acceptedOrders = computed(() => orders.value.filter(o => o.status === 'ACCEPTED'))

  async function fetchOrders(params) {
    loading.value = true
    try {
      const res = await getOrderList(params)
      orders.value = res.data?.list || []
      total.value = res.data?.total || 0
    } finally {
      loading.value = false
    }
  }

  function setCurrentOrder(order) {
    currentOrder.value = order
  }

  function updateOrderStatus(orderId, status) {
    const idx = orders.value.findIndex(o => o.id === orderId)
    if (idx !== -1) {
      orders.value[idx].status = status
    }
  }

  return { orders, currentOrder, loading, total, pendingOrders, acceptedOrders, fetchOrders, setCurrentOrder, updateOrderStatus }
})

export const useDashboardStore = defineStore('dashboard', () => {
  const stats = ref({
    totalOrders: 0,
    signedOrders: 0,
    timeoutOrders: 0,
    settlementAccuracy: 0
  })
  const loading = ref(false)

  async function fetchStats() {
    loading.value = true
    try {
      const res = await getStats()
      stats.value = res.data || stats.value
    } finally {
      loading.value = false
    }
  }

  return { stats, loading, fetchStats }
})
