import request from './request'

export const getUserList = (params) => {
  return request({
    url: '/user/list',
    method: 'get',
    params: {
      pageNum: params.page || 1,
      pageSize: params.size || 10,
      keyword: params.keyword,
      role: params.role
    }
  })
}

export const getUser = (id) => {
  return request({
    url: `/user/${id}`,
    method: 'get'
  })
}

export const updateUser = (id, data) => {
  return request({
    url: `/user/${id}`,
    method: 'put',
    data
  })
}

export const getNotificationList = (params) => {
  return request({
    url: '/notification/list',
    method: 'get',
    params
  })
}

export const getUnreadNotificationCount = () => {
  return request({
    url: '/notification/unread-count',
    method: 'get'
  })
}

export const markNotificationRead = (ids) => {
  return request({
    url: '/notification/read',
    method: 'put',
    data: { ids }
  })
}

export const adminGetUserList = (params) => getUserList(params)

export const adminUpdateUserRole = (userId, data) => {
  const role = typeof data === 'string' ? data : data.role
  return updateUser(userId, { role })
}

export const adminUpdateUserMembership = (userId, data) => {
  const memberExpireTime = data?.expireDate || data?.memberExpireTime
  return updateUser(userId, { memberExpireTime })
}

export const adminDeleteUser = (userId) => {
  return request({
    url: `/user/${userId}`,
    method: 'delete'
  })
}
