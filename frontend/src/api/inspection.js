import request from '@/utils/request'

export function checkIn(pointId, status, abnormalDescription, lng, lat) {
  return request({
    url: '/inspection/checkin',
    method: 'post',
    params: { pointId, status, abnormalDescription, lng, lat }
  })
}

export function handleAbnormal(id, handleRemark, createOrder) {
  return request({
    url: `/inspection/records/${id}/handle`,
    method: 'post',
    params: { handleRemark, createOrder }
  })
}

export function getRecordPage(params) {
  return request({
    url: '/inspection/records',
    method: 'get',
    params
  })
}

export function getPointPage(params) {
  return request({
    url: '/inspection/points',
    method: 'get',
    params
  })
}
