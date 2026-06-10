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
  return request({
    url: '/auth/logout',
    method: 'post'
  })
}

export const getUserInfo = () => {
  return request({
    url: '/user/info',
    method: 'get'
  })
}

export const updateUserInfo = (data) => {
  return request({
    url: '/user/update',
    method: 'put',
    data
  })
}

export const getCourseList = (params) => {
  return request({
    url: '/courses',
    method: 'get',
    params
  })
}

export const getCourseDetail = (id) => {
  return request({
    url: `/courses/${id}`,
    method: 'get'
  })
}

export const getCategoryList = () => {
  return request({
    url: '/categories',
    method: 'get'
  })
}

export const getUserCourses = () => {
  return request({
    url: '/user/courses',
    method: 'get'
  })
}

export const enrollCourse = (courseId) => {
  return request({
    url: `/courses/${courseId}/enroll`,
    method: 'post'
  })
}

export const getDashboardStats = () => {
  return request({
    url: '/admin/dashboard/stats',
    method: 'get'
  })
}

export const getUserManagementList = (params) => {
  return request({
    url: '/admin/users',
    method: 'get',
    params
  })
}

export const updateUserRole = (userId, data) => {
  return request({
    url: `/admin/users/${userId}/role`,
    method: 'put',
    data
  })
}

export const deleteUser = (userId) => {
  return request({
    url: `/admin/users/${userId}`,
    method: 'delete'
  })
}

export const createCourse = (data) => {
  return request({
    url: '/admin/courses',
    method: 'post',
    data
  })
}

export const updateCourse = (id, data) => {
  return request({
    url: `/admin/courses/${id}`,
    method: 'put',
    data
  })
}

export const deleteCourse = (id) => {
  return request({
    url: `/admin/courses/${id}`,
    method: 'delete'
  })
}

export const createCategory = (data) => {
  return request({
    url: '/admin/categories',
    method: 'post',
    data
  })
}

export const updateCategory = (id, data) => {
  return request({
    url: `/admin/categories/${id}`,
    method: 'put',
    data
  })
}

export const deleteCategory = (id) => {
  return request({
    url: `/admin/categories/${id}`,
    method: 'delete'
  })
}
