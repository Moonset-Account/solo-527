import request from './request'

export const getOverview = () => {
  return request({
    url: '/stats/overview',
    method: 'get'
  })
}

export const getDrilldown = (params) => {
  return request({
    url: '/stats/drilldown',
    method: 'get',
    params
  })
}

export const getCommissionReport = (params) => {
  return request({
    url: '/stats/commission',
    method: 'get',
    params
  })
}

export const getDashboardOverview = getOverview
export const getTotalStudents = () => getOverview()
export const getTotalCourses = () => getOverview()
export const getTodayOrders = () => getOverview()
export const getMonthlyRevenue = () => getOverview()

export const getCourseCompletionRates = (params) => {
  return request({
    url: '/study/completion-rate',
    method: 'get',
    params: { ...params, dimension: 'course' }
  })
}

export const getDisputeOrderList = (params) => {
  return request({
    url: '/order/list',
    method: 'get',
    params: { ...params, pageNum: params.page || 1, pageSize: params.size || 20, commissionStatus: 2 }
  })
}

export const getRevenueOrderDetails = (params) => {
  return request({
    url: '/stats/drilldown',
    method: 'get',
    params: { ...params, dimension: 'day' }
  })
}

export const getOrderOrderDetails = (params) => {
  return request({
    url: '/stats/drilldown',
    method: 'get',
    params: { ...params, dimension: 'day' }
  })
}

export const getStudentUserDetails = (params) => {
  return request({
    url: '/stats/drilldown',
    method: 'get',
    params: { ...params, dimension: 'user' }
  })
}

export const getCourseCourseDetails = (params) => {
  return request({
    url: '/stats/drilldown',
    method: 'get',
    params: { ...params, dimension: 'course' }
  })
}
