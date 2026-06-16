import request from '@/utils/request'

export function getCoachPage(params) {
  return request({
    url: '/coach/page',
    method: 'get',
    params
  })
}

export function getCoachById(id) {
  return request({
    url: `/coach/${id}`,
    method: 'get'
  })
}

export function addCoach(data) {
  return request({
    url: '/coach',
    method: 'post',
    data
  })
}

export function updateCoach(data) {
  return request({
    url: '/coach',
    method: 'put',
    data
  })
}

export function deleteCoach(id) {
  return request({
    url: `/coach/${id}`,
    method: 'delete'
  })
}
