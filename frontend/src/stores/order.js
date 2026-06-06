import { defineStore } from 'pinia'
import { ref } from 'vue'
import request from '@/utils/request'

export const useOrderStore = defineStore('order', () => {
  const orders = ref([])
  const currentOrder = ref(null)
  const pagination = ref({
    page: 1,
    perPage: 20,
    total: 0,
  })
  const filters = ref({})
  const loading = ref(false)

  async function fetchOrders(params = {}) {
    loading.value = true
    try {
      const response = await request.get('/orders', {
        params: {
          page: pagination.value.page,
          per_page: pagination.value.perPage,
          ...filters.value,
          ...params,
        },
      })
      orders.value = response.data.data
      pagination.value.total = response.data.total
      return response
    } finally {
      loading.value = false
    }
  }

  async function fetchOrder(id) {
    loading.value = true
    try {
      const response = await request.get(`/orders/${id}`)
      currentOrder.value = response.data
      return response
    } finally {
      loading.value = false
    }
  }

  async function createOrder(data) {
    loading.value = true
    try {
      const response = await request.post('/orders', data)
      await fetchOrders()
      return response
    } finally {
      loading.value = false
    }
  }

  async function confirmOrder(id) {
    loading.value = true
    try {
      const response = await request.post(`/orders/${id}/confirm`)
      if (currentOrder.value?.id === id) {
        currentOrder.value = response.data
      }
      await fetchOrders()
      return response
    } finally {
      loading.value = false
    }
  }

  async function cancelOrder(id, reason) {
    loading.value = true
    try {
      const response = await request.post(`/orders/${id}/cancel`, { reason })
      if (currentOrder.value?.id === id) {
        currentOrder.value = response.data
      }
      await fetchOrders()
      return response
    } finally {
      loading.value = false
    }
  }

  async function splitOrder(id, splitData) {
    loading.value = true
    try {
      const response = await request.post(`/orders/${id}/split`, splitData)
      await fetchOrders()
      return response
    } finally {
      loading.value = false
    }
  }

  function setFilters(newFilters) {
    filters.value = newFilters
    pagination.value.page = 1
  }

  function setPage(page) {
    pagination.value.page = page
  }

  return {
    orders,
    currentOrder,
    pagination,
    filters,
    loading,
    fetchOrders,
    fetchOrder,
    createOrder,
    confirmOrder,
    cancelOrder,
    splitOrder,
    setFilters,
    setPage,
  }
})
