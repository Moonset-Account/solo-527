import request from '@/utils/request'

export function getActivities(params) {
  return request({
    url: '/activities/',
    method: 'get',
    params
  })
}

export function getActivity(id) {
  return request({
    url: `/activities/${id}/`,
    method: 'get'
  })
}

export function registerActivity(id) {
  return request({
    url: `/activities/${id}/register/`,
    method: 'post'
  })
}

export function getMyRegistrations() {
  return request({
    url: '/activities/my_registrations/',
    method: 'get'
  })
}

export function cancelRegistration(id) {
  return request({
    url: `/activities/registrations/${id}/cancel/`,
    method: 'post'
  })
}
