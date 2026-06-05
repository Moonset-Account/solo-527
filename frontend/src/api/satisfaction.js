import request from '@/utils/request'

export function submitSatisfaction(workOrderId, overallScore, responseSpeedScore, serviceAttitudeScore, qualityScore, content, isSolved) {
  return request({
    url: '/satisfaction',
    method: 'post',
    params: { workOrderId, overallScore, responseSpeedScore, serviceAttitudeScore, qualityScore, content, isSolved }
  })
}

export function getSatisfactionPage(params) {
  return request({
    url: '/satisfaction',
    method: 'get',
    params
  })
}
