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
    params: { pageNum: params.page || 1, pageSize: params.size || 10, commissionStatus: 2 }
  })
}
