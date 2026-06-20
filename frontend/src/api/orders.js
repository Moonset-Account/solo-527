import request from '@/utils/request'

export const getOrders = (params) => {
  return request.get('/orders', { params })
}

export const getOrder = (id) => {
  return request.get(`/orders/${id}`)
}

export const createOrder = (data) => {
  return request.post('/orders', data)
}

export const confirmOrder = (id) => {
  return request.post(`/orders/${id}/confirm`)
}

export const refundOrder = (id, reason) => {
  return request.post(`/orders/${id}/refund`, { reason })
}

export const cancelOrder = (id, reason) => {
  return request.post(`/orders/${id}/cancel`, { reason })
}
