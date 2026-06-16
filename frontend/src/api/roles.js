import request from '@/utils/request'

export function getRoleList(params) {
  return request({
    url: '/roles',
    method: 'get',
    params
  })
}

export function getRoleDetail(id) {
  return request({
    url: `/roles/${id}`,
    method: 'get'
  })
}

export function createRole(data) {
  return request({
    url: '/roles',
    method: 'post',
    data
  })
}

export function updateRole(id, data) {
  return request({
    url: `/roles/${id}`,
    method: 'put',
    data
  })
}

export function deleteRole(id) {
  return request({
    url: `/roles/${id}`,
    method: 'delete'
  })
}

export function assignRolePermissions(id, data) {
  return request({
    url: `/roles/${id}/permissions`,
    method: 'post',
    data
  })
}
