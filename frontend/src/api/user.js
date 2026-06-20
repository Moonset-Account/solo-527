import request from '../utils/request'

export const getUserList = (params) => {
  return request({
    url: '/users',
    method: 'get',
    params,
  })
}

export const getAllUsers = () => {
  return request({
    url: '/users/all',
    method: 'get',
  })
}

export const getUsersByRole = (role) => {
  return request({
    url: `/users/role/${role}`,
    method: 'get',
  })
}

export const getUserDetail = (id) => {
  return request({
    url: `/users/${id}`,
    method: 'get',
  })
}

export const createUser = (data) => {
  return request({
    url: '/users',
    method: 'post',
    data,
  })
}

export const updateUser = (id, data) => {
  return request({
    url: `/users/${id}`,
    method: 'put',
    data,
  })
}

export const deleteUser = (id) => {
  return request({
    url: `/users/${id}`,
    method: 'delete',
  })
}

export const updateUserStatus = (id, status) => {
  return request({
    url: `/users/${id}/status`,
    method: 'put',
    data: { status },
  })
}
