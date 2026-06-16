import request from '@/utils/request'

export function login(data) {
  return request({
    url: '/auth/login',
    method: 'post',
    data
  })
}

export function logout() {
  return request({
    url: '/auth/logout',
    method: 'post'
  })
}

export function getProfile() {
  return request({
    url: '/account/profile',
    method: 'get'
  })
}

export function updateProfile(data) {
  return request({
    url: '/account/profile',
    method: 'put',
    data
  })
}
