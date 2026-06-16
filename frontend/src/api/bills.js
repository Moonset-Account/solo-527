import request from '@/utils/request'

export function getBillList(params) {
  return request({
    url: '/bills',
    method: 'get',
    params
  })
}

export function getBillDetail(id) {
  return request({
    url: `/bills/${id}`,
    method: 'get'
  })
}

export function createBill(data) {
  return request({
    url: '/bills',
    method: 'post',
    data
  })
}

export function updateBill(id, data) {
  return request({
    url: `/bills/${id}`,
    method: 'put',
    data
  })
}

export function deleteBill(id) {
  return request({
    url: `/bills/${id}`,
    method: 'delete'
  })
}

export function generateBills(data) {
  return request({
    url: '/bills/generate',
    method: 'post',
    data
  })
}

export function exportBills(params) {
  return request({
    url: '/bills/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}

export function getBillingCycles() {
  return request({
    url: '/billing-cycles',
    method: 'get'
  })
}

export function createBillingCycle(data) {
  return request({
    url: '/billing-cycles',
    method: 'post',
    data
  })
}

export function updateBillingCycle(id, data) {
  return request({
    url: `/billing-cycles/${id}`,
    method: 'put',
    data
  })
}

export function deleteBillingCycle(id) {
  return request({
    url: `/billing-cycles/${id}`,
    method: 'delete'
  })
}

export function setDefaultBillingCycle(id) {
  return request({
    url: `/billing-cycles/${id}/default`,
    method: 'patch'
  })
}
