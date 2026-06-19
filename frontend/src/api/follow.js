import request from '@/utils/request'

export function createFollow(data) {
  return request({
    url: '/follows',
    method: 'post',
    data
  })
}

export function getFollowList(leadId) {
  return request({
    url: '/follows',
    method: 'get',
    params: { leadId }
  })
}

export function getTimeline(params) {
  return request({
    url: '/follows/timeline',
    method: 'get',
    params
  })
}
