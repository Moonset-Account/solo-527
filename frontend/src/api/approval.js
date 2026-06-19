import request from '@/utils/request'

export function getApprovalList(params) {
  return request({
    url: '/approvals',
    method: 'get',
    params
  })
}

export function getApprovalDetail(id) {
  return request({
    url: `/approvals/${id}`,
    method: 'get'
  })
}

export function createDiscountApproval(data) {
  return request({
    url: '/approvals/discount',
    method: 'post',
    data
  })
}

export function submitApproval(id) {
  return request({
    url: `/approvals/${id}/submit`,
    method: 'post'
  })
}

export function approveApproval(id, data) {
  return request({
    url: `/approvals/${id}/approve`,
    method: 'post',
    data
  })
}

export function rejectApproval(id, data) {
  return request({
    url: `/approvals/${id}/reject`,
    method: 'post',
    data
  })
}
