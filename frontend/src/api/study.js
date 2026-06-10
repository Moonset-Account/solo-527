import request from './request'

export const getContinueStudy = () => {
  return request({
    url: '/study/continue',
    method: 'get'
  })
}

export const updateProgress = (data) => {
  return request({
    url: '/study/progress',
    method: 'post',
    data
  })
}

export const getCompletionRate = (params) => {
  return request({
    url: '/study/completion-rate',
    method: 'get',
    params
  })
}

export const checkIn = (data) => {
  return request({
    url: '/study/check-in',
    method: 'post',
    data
  })
}

export const getCheckInList = (params) => {
  return request({
    url: '/study/checkin-list',
    method: 'get',
    params
  })
}
