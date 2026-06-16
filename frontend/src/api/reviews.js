import request from '@/utils/request'

export function getReviewList(params) {
  return request({
    url: '/reviews',
    method: 'get',
    params
  })
}

export function getReview(id) {
  return request({
    url: `/reviews/${id}`,
    method: 'get'
  })
}

export function reviewDraft(id, data) {
  return request({
    url: `/reviews/${id}`,
    method: 'post',
    data
  })
}

export function approveDraft(id, data) {
  return request({
    url: `/reviews/${id}/approve`,
    method: 'post',
    data
  })
}

export function rejectDraft(id, data) {
  return request({
    url: `/reviews/${id}/reject`,
    method: 'post',
    data
  })
}

export function getReviewStatistics(params) {
  return request({
    url: '/reviews/statistics',
    method: 'get',
    params
  })
}
