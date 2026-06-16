import request from '@/utils/request'

export function getSettings() {
  return request({
    url: '/settings',
    method: 'get'
  })
}

export function updateSettings(data) {
  return request({
    url: '/settings',
    method: 'put',
    data
  })
}

export function getEmailSettings() {
  return request({
    url: '/settings/email',
    method: 'get'
  })
}

export function updateEmailSettings(data) {
  return request({
    url: '/settings/email',
    method: 'put',
    data
  })
}

export function testEmailSettings(data) {
  return request({
    url: '/settings/email/test',
    method: 'post',
    data
  })
}

export function getAISettings() {
  return request({
    url: '/settings/ai',
    method: 'get'
  })
}

export function updateAISettings(data) {
  return request({
    url: '/settings/ai',
    method: 'put',
    data
  })
}

export function testAISettings(data) {
  return request({
    url: '/settings/ai/test',
    method: 'post',
    data
  })
}
