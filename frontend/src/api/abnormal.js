import request from '../utils/request'

export function getAbnormalPage(params) {
  return request({
    url: '/abnormal/page',
    method: 'get',
    params
  })
}

export function getAbnormalDetail(id) {
  return request({
    url: '/abnormal/' + id,
    method: 'get'
  })
}

export function saveAbnormal(data) {
  return request({
    url: '/abnormal/save',
    method: 'post',
    data
  })
}

export function handleAbnormal(data) {
  return request({
    url: '/abnormal/handle',
    method: 'post',
    data
  })
}

export function updateAbnormalStatus(id, status) {
  return request({
    url: '/abnormal/status/' + id + '/' + status,
    method: 'put'
  })
}

export function getAbnormalOverview() {
  return request({
    url: '/abnormal/overview',
    method: 'get'
  })
}
