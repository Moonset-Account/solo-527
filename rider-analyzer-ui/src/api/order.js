import request from './request'

export function acceptOrder(data) {
  return request.post('/orders/accept', data)
}

export function getTodoDetail(id) {
  return request.get(`/orders/todo/${id}`)
}

export function getRouteInfo(id) {
  return request.get(`/orders/route/${id}`)
}

export function getOrderList(params) {
  return request.get('/orders/list', { params })
}

export function updateOrderStatus(orderId, status) {
  return request.put(`/orders/${orderId}/status`, { status })
}
