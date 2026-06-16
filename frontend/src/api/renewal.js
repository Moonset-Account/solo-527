import request from '@/utils/request'

export function getRenewalList(params) {
  return request({
    url: '/renewal-lists',
    method: 'get',
    params
  })
}

export function getRenewalDetail(id) {
  return request({
    url: `/renewal-lists/${id}`,
    method: 'get'
  })
}

export function createRenewal(data) {
  return request({
    url: '/renewal-lists',
    method: 'post',
    data
  })
}

export function updateRenewal(id, data) {
  return request({
    url: `/renewal-lists/${id}`,
    method: 'put',
    data
  })
}

export function deleteRenewal(id) {
  return request({
    url: `/renewal-lists/${id}`,
    method: 'delete'
  })
}

export function assignRenewal(id, data) {
  return request({
    url: `/renewal-lists/${id}/assign`,
    method: 'post',
    data
  })
}

export function followUpRenewal(id, data) {
  return request({
    url: `/renewal-lists/${id}/follow-up`,
    method: 'post',
    data
  })
}

export function getRenewalStats() {
  return request({
    url: '/renewal-lists/stats',
    method: 'get'
  })
}

export function exportRenewals(params) {
  return request({
    url: '/renewal-lists/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}

export function batchImportRenewals(data) {
  return request({
    url: '/renewal-lists/batch-import',
    method: 'post',
    data
  })
}
