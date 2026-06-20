import request from '../utils/request'

export const getFunnelStages = () => {
  return request({
    url: '/dashboard/funnel-stages',
    method: 'get',
  })
}

export const getFunnelData = () => {
  return request({
    url: '/dashboard/funnel-data',
    method: 'get',
  })
}

export const getStatistics = () => {
  return request({
    url: '/dashboard/statistics',
    method: 'get',
  })
}
