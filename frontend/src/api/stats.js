import request from './request'

export const getDashboardOverview = () => {
  return request({
    url: '/admin/stats/dashboard-overview',
    method: 'get'
  })
}

export const getTotalStudents = () => {
  return request({
    url: '/admin/stats/total-students',
    method: 'get'
  })
}

export const getTotalCourses = () => {
  return request({
    url: '/admin/stats/total-courses',
    method: 'get'
  })
}

export const getTodayOrders = () => {
  return request({
    url: '/admin/stats/today-orders',
    method: 'get'
  })
}

export const getMonthlyRevenue = () => {
  return request({
    url: '/admin/stats/monthly-revenue',
    method: 'get'
  })
}

export const getCourseCompletionRates = (params) => {
  return request({
    url: '/admin/stats/course-completion-rates',
    method: 'get',
    params
  })
}

export const getDisputeOrderList = (params) => {
  return request({
    url: '/admin/stats/dispute-orders',
    method: 'get',
    params
  })
}

export const getRevenueOrderDetails = (params) => {
  return request({
    url: '/admin/stats/revenue-order-details',
    method: 'get',
    params
  })
}

export const getOrderOrderDetails = (params) => {
  return request({
    url: '/admin/stats/order-order-details',
    method: 'get',
    params
  })
}

export const getStudentUserDetails = (params) => {
  return request({
    url: '/admin/stats/student-user-details',
    method: 'get',
    params
  })
}

export const getCourseCourseDetails = (params) => {
  return request({
    url: '/admin/stats/course-course-details',
    method: 'get',
    params
  })
}
