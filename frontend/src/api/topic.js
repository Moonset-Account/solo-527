import request from '../utils/request'

export function getTopicPage(params) {
  return request({
    url: '/topic/page',
    method: 'get',
    params
  })
}

export function getTopicDetail(id) {
  return request({
    url: '/topic/' + id,
    method: 'get'
  })
}

export function saveTopic(data) {
  return request({
    url: '/topic/save',
    method: 'post',
    data
  })
}

export function updateTopicStatus(id, status) {
  return request({
    url: '/topic/status/' + id + '/' + status,
    method: 'put'
  })
}

export function deleteTopic(id) {
  return request({
    url: '/topic/' + id,
    method: 'delete'
  })
}

export function getTopicOverview() {
  return request({
    url: '/topic/overview',
    method: 'get'
  })
}
