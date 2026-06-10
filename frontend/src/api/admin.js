import request from './request'

export const adminGetUserList = (params) => {
  return request({
    url: '/admin/users',
    method: 'get',
    params
  })
}

export const adminGetUserDetail = (userId) => {
  return request({
    url: `/admin/users/${userId}`,
    method: 'get'
  })
}

export const adminUpdateUserRole = (userId, data) => {
  return request({
    url: `/admin/users/${userId}/role`,
    method: 'put',
    data
  })
}

export const adminUpdateUserMembership = (userId, data) => {
  return request({
    url: `/admin/users/${userId}/membership`,
    method: 'put',
    data
  })
}

export const adminDeleteUser = (userId) => {
  return request({
    url: `/admin/users/${userId}`,
    method: 'delete'
  })
}

export const adminGetRoleList = () => {
  return request({
    url: '/admin/roles',
    method: 'get'
  })
}

export const adminUpdateUserStatus = (userId, data) => {
  return request({
    url: `/admin/users/${userId}/status`,
    method: 'put',
    data
  })
}
