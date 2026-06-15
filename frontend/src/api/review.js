import request from '../utils/request'

export function getReviewPage(params) {
  return request({
    url: '/review/page',
    method: 'get',
    params
  })
}

export function getReviewListByBusiness(businessId, reviewType) {
  return request({
    url: '/review/list/' + businessId,
    method: 'get',
    params: { reviewType }
  })
}

export function getReviewDetail(id) {
  return request({
    url: '/review/' + id,
    method: 'get'
  })
}

export function addReviewRecord(data) {
  return request({
    url: '/review/add',
    method: 'post',
    data
  })
}
