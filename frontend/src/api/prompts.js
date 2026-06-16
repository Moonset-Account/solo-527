import request from '@/utils/request'

export function getPromptList(params) {
  return request({
    url: '/prompts',
    method: 'get',
    params
  })
}

export function getPrompt(id) {
  return request({
    url: `/prompts/${id}`,
    method: 'get'
  })
}

export function createPrompt(data) {
  return request({
    url: '/prompts',
    method: 'post',
    data
  })
}

export function updatePrompt(id, data) {
  return request({
    url: `/prompts/${id}`,
    method: 'put',
    data
  })
}

export function deletePrompt(id) {
  return request({
    url: `/prompts/${id}`,
    method: 'delete'
  })
}

export function getPromptCategories() {
  return request({
    url: '/prompts/categories',
    method: 'get'
  })
}

export function setDefaultPrompt(id) {
  return request({
    url: `/prompts/${id}/default`,
    method: 'post'
  })
}

export function testPrompt(data) {
  return request({
    url: '/prompts/test',
    method: 'post',
    data
  })
}
