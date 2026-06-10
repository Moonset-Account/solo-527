import request from './request'

export const createOrder = (data) => {
  return request({
    url: '/order/create',
    method: 'post',
    data
  })
}

export const getOrderList = (params) => {
  return request({
    url: '/order/list',
    method: 'get',
    params: {
      pageNum: params.page || 1,
      pageSize: params.size || 10,
      payStatus: params.payStatus,
      commissionStatus: params.commissionStatus,
      orderType: params.orderType,
      userId: params.userId
    }
  })
}

export const getOrderDetail = (id) => {
  return request({
    url: `/order/${id}`,
    method: 'get'
  })
}

export const paymentCallback = (orderNo, payStatus, payMethod) => {
  return request({
    url: '/order/callback',
    method: 'post',
    params: { orderNo, payStatus, payMethod }
  })
}

export const adminGetOrderList = (params) => {
  return getOrderList(params)
}

export const adminTriggerCommissionDispute = (data) => {
  return request({
    url: '/order/commission-dispute',
    method: 'put',
    data
  })
}

export const adminConfirmCommissionDispute = (orderId, resolve) => {
  return request({
    url: '/order/commission-confirm',
    method: 'put',
    params: { orderId, resolve }
  })
}

export const adminSettleCommission = (referrerId) => {
  return request({
    url: `/order/settle/${referrerId}`,
    method: 'post'
  })
}

export const getRepurchaseStats = (referrerId) => {
  return request({
    url: '/order/repurchase-stats',
    method: 'get',
    params: referrerId ? { referrerId } : {}
  })
}

export const adminCreateCommissionDispute = (orderIdOrData, extra) => {
  const payload = typeof orderIdOrData === 'object'
    ? { orderId: orderIdOrData.orderId, note: orderIdOrData.reason || orderIdOrData.remark || orderIdOrData.note || '' }
    : { orderId: orderIdOrData, note: extra?.reason || extra?.remark || extra?.note || '' }
  return adminTriggerCommissionDispute(payload)
}

export const adminCloseCommissionDispute = (orderId, data) => {
  const resolve = data?.result === 'uphold' || data?.resolve === true
  return adminConfirmCommissionDispute(orderId, resolve)
}

export const adminGetRepurchaseContribution = (params) => {
  return getRepurchaseStats(params?.referrerId)
}

export const adminGetDisputeOrders = (params) => {
  return getOrderList({ ...params, commissionStatus: 2 })
}
