import request from '@/utils/request'

export function getInspectionPage(params) {
  return request({
    url: '/inspection/page',
    method: 'get',
    params
  })
}

export function getInspectionById(id) {
  return request({
    url: `/inspection/${id}`,
    method: 'get'
  })
}

export function createInspection(data) {
  return request({
    url: '/inspection',
    method: 'post',
    data
  })
}

export function assignInspector(id, inspectorId) {
  return request({
    url: `/inspection/${id}/assign`,
    method: 'put',
    params: { inspectorId }
  })
}

export function submitInspectionResult(id, data) {
  return request({
    url: `/inspection/${id}/submit`,
    method: 'put',
    data
  })
}
