import request from '../utils/request'

export function getScriptPage(params) {
  return request({
    url: '/script/page',
    method: 'get',
    params
  })
}

export function getScriptDetail(id) {
  return request({
    url: '/script/' + id,
    method: 'get'
  })
}

export function saveScript(data) {
  return request({
    url: '/script/save',
    method: 'post',
    data
  })
}

export function updateScriptStatus(id, status) {
  return request({
    url: '/script/status/' + id + '/' + status,
    method: 'put'
  })
}

export function deleteScript(id) {
  return request({
    url: '/script/' + id,
    method: 'delete'
  })
}

export function getScriptListByTopic(topicId) {
  return request({
    url: '/script/list/topic/' + topicId,
    method: 'get'
  })
}

export function getScriptOverview() {
  return request({
    url: '/script/overview',
    method: 'get'
  })
}
