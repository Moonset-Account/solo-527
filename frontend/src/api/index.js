import request from './request'

export const login = (data) => {
  return request({
    url: '/auth/login',
    method: 'post',
    data
  })
}

export const register = (data) => {
  return request({
    url: '/auth/register',
    method: 'post',
    data
  })
}

export const logout = () => {
  return Promise.resolve({ success: true })
}

export const getCurrentUser = () => {
  return request({
    url: '/auth/me',
    method: 'get'
  })
}

export const getMemberInfo = () => {
  return request({
    url: '/user/member-info',
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

export const getUser = (id) => {
  return request({
    url: `/user/${id}`,
    method: 'get'
  })
}

export const getCourseList = (params) => {
  return request({
    url: '/course/list',
    method: 'get',
    params
  })
}

export const getCourseDetail = (id) => {
  return request({
    url: `/course/${id}`,
    method: 'get'
  })
}

export const getHomeData = () => {
  return request({
    url: '/course/home',
    method: 'get'
  })
}
