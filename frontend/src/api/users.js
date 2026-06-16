import request from './index'

export function listUsers() {
  return request.get('/users')
}

export function getUserById(id) {
  return request.get(`/users/${id}`)
}

export function searchUsers(keyword) {
  return request.get('/users/search', { params: { keyword } })
}
