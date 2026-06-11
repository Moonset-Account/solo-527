export interface Order {
  id: number
  orderNo: string
  userId: number
  roomId: number
  checkIn: string
  checkOut: string
  guestCount: number
  guestName: string
  guestPhone: string
  totalPrice: number
  status: 'PENDING_PAYMENT' | 'PAID' | 'CHECKED_IN' | 'CHECKED_OUT' | 'REFUNDING' | 'REFUNDED' | 'CANCELLED'
  refundReason: string | null
  createdAt: string
  updatedAt: string
  room?: { id: number; name: string; type: string; basePrice: number }
  user?: { id: number; name: string; phone: string }
}

export interface OrderListResult {
  data: Order[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export function useOrders() {
  const orders = ref<Order[]>([])
  const currentOrder = ref<Order | null>(null)
  const loading = ref(false)
  const pagination = ref({ page: 1, pageSize: 20, total: 0, totalPages: 0 })

  async function fetchOrders(params?: { status?: string; page?: number; pageSize?: number }) {
    loading.value = true
    try {
      const query = new URLSearchParams()
      if (params?.status) query.set('status', params.status)
      if (params?.page) query.set('page', String(params.page))
      if (params?.pageSize) query.set('pageSize', String(params.pageSize))
      const data = await $fetch<OrderListResult>(`/api/orders?${query.toString()}`)
      orders.value = data.data
      pagination.value = data.pagination
    } finally {
      loading.value = false
    }
  }

  async function fetchOrder(id: number) {
    loading.value = true
    try {
      const data = await $fetch<Order>(`/api/orders/${id}`)
      currentOrder.value = data
      return data
    } finally {
      loading.value = false
    }
  }

  async function requestRefund(id: number, reason: string) {
    return await $fetch(`/api/orders/${id}/refund`, {
      method: 'POST',
      body: { reason },
    })
  }

  return { orders, currentOrder, loading, pagination, fetchOrders, fetchOrder, requestRefund }
}
