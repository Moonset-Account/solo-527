import request from './request'

export function acceptOrder(orderId) {
  return request.post(`/orders/${orderId}/accept`)
}

export function getTodoDetail(orderId) {
  return request.get(`/orders/${orderId}/todo`)
}

export function getRouteInfo(orderId) {
  return request.get(`/orders/${orderId}/route`)
}

export function getOrderList(params) {
  return request.get('/orders', { params })
}
