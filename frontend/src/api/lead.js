import request from '@/utils/request'

export function getLeadList(params) {
  return request({
    url: '/leads',
    method: 'get',
    params
  })
}

export function getLeadDetail(id) {
  return request({
    url: `/leads/${id}`,
    method: 'get'
  })
}

export function createLead(data) {
  return request({
    url: '/leads',
    method: 'post',
    data
  })
}

export function updateLead(id, data) {
  return request({
    url: `/leads/${id}`,
    method: 'put',
    data
  })
}

export function updateLeadStatus(id, status) {
  return request({
    url: `/leads/${id}/status`,
    method: 'put',
    params: { status }
  })
}

export function assignLead(id, ownerId) {
  return request({
    url: `/leads/${id}/assign`,
    method: 'put',
    params: { ownerId }
  })
}

export function detectConflict(id) {
  return request({
    url: `/leads/${id}/conflict`,
    method: 'get'
  })
}
