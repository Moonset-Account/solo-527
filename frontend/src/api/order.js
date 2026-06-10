import request from './request'

export const createOrder = (data) => {
  return request({
    url: '/orders',
    method: 'post',
    data
  })
}

export const getOrderList = (params) => {
  return request({
    url: '/orders',
    method: 'get',
    params
  })
}

export const getOrderDetail = (orderId) => {
  return request({
    url: `/orders/${orderId}`,
    method: 'get'
  })
}

export const payOrder = (orderId, data) => {
  return request({
    url: `/orders/${orderId}/pay`,
    method: 'post',
    data
  })
}

export const adminGetOrderList = (params) => {
  return request({
    url: '/admin/orders',
    method: 'get',
    params
  })
}

export const adminGetOrderDetail = (orderId) => {
  return request({
    url: `/admin/orders/${orderId}`,
    method: 'get'
  })
}

export const adminUpdateOrderStatus = (orderId, data) => {
  return request({
    url: `/admin/orders/${orderId}/status`,
    method: 'put',
    data
  })
}

export const adminCreateCommissionDispute = (orderId, data) => {
  return request({
    url: `/admin/orders/${orderId}/commission-dispute`,
    method: 'post',
    data
  })
}

export const adminCloseCommissionDispute = (orderId, data) => {
  return request({
    url: `/admin/orders/${orderId}/commission-dispute/close`,
    method: 'post',
    data
  })
}

export const adminGetDisputeOrders = (params) => {
  return request({
    url: '/admin/orders/disputes',
    method: 'get',
    params
  })
}

export const adminGetCommissionStats = (params) => {
  return request({
    url: '/admin/orders/commission-stats',
    method: 'get',
    params
  })
}

export const adminGetRepurchaseContribution = (params) => {
  return request({
    url: '/admin/orders/repurchase-contribution',
    method: 'get',
    params
  })
}
