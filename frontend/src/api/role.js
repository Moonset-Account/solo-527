import request from './index'

export function createRole(data) {
  return request.post('/roles', data)
}

export function updateRole(id, data) {
  return request.put(`/roles/${id}`, data)
}

export function deleteRole(id) {
  return request.delete(`/roles/${id}`)
}

export function getRolesByType(type) {
  return request.get(`/roles/type/${type}`)
}

export function getRoles() {
  return request.get('/roles')
}
