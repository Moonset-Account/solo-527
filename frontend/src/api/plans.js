import request from '@/utils/request'

export function getPlanList(params) {
  return request({
    url: '/plans',
    method: 'get',
    params
  })
}

export function getPlanDetail(id) {
  return request({
    url: `/plans/${id}`,
    method: 'get'
  })
}

export function createPlan(data) {
  return request({
    url: '/plans',
    method: 'post',
    data
  })
}

export function updatePlan(id, data) {
  return request({
    url: `/plans/${id}`,
    method: 'put',
    data
  })
}

export function deletePlan(id) {
  return request({
    url: `/plans/${id}`,
    method: 'delete'
  })
}
