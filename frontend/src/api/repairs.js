import request from '@/utils/request'

export function getRepairs(params) {
  return request({
    url: '/repairs/',
    method: 'get',
    params
  })
}

export function createRepair(data) {
  return request({
    url: '/repairs/',
    method: 'post',
    data,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export function startRepair(id) {
  return request({
    url: `/repairs/${id}/start_repair/`,
    method: 'post'
  })
}

export function completeRepair(id) {
  return request({
    url: `/repairs/${id}/complete_repair/`,
    method: 'post'
  })
}
