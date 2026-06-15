import request from '../utils/request'

export function login(data) {
  return request({
    url: '/user/login',
    method: 'post',
    data
  })
}

export function getUserList(params) {
  return request({
    url: '/user/list',
    method: 'get',
    params
  })
}

export function getCreatorList() {
  return request({
    url: '/user/creators',
    method: 'get'
  })
}

export function getReviewerList() {
  return request({
    url: '/user/reviewers',
    method: 'get'
  })
}

export function getOperatorList() {
  return request({
    url: '/user/operators',
    method: 'get'
  })
}
