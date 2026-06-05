import request from '@/utils/request'

export function createOrder(data) {
  return request({
    url: '/orders',
    method: 'post',
    data
  })
}

export function approveOrder(id, approved, rejectReason, assigneeId) {
  return request({
    url: `/orders/${id}/approve`,
    method: 'post',
    params: { approved, rejectReason, assigneeId }
  })
}

export function startProcess(id) {
  return request({
    url: `/orders/${id}/start`,
    method: 'post'
  })
}

export function completeOrder(id, handlerRemark, actualCost) {
  return request({
    url: `/orders/${id}/complete`,
    method: 'post',
    params: { handlerRemark, actualCost }
  })
}

export function closeOrder(id) {
  return request({
    url: `/orders/${id}/close`,
    method: 'post'
  })
}

export function getOrderPage(params) {
  return request({
    url: '/orders',
    method: 'get',
    params
  })
}

export function getOrderDetail(id) {
  return request({
    url: `/orders/${id}`,
    method: 'get'
  })
}

export function getOrderHistory(id) {
  return request({
    url: `/orders/${id}/history`,
    method: 'get'
  })
}

export function getDashboardStats() {
  return request({
    url: '/orders/dashboard/stats',
    method: 'get'
  })
}
