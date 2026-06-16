import request from './index'

export function createMinutes(data) {
  return request.post('/meetings', data)
}

export function updateMinutes(id, data) {
  return request.put(`/meetings/${id}`, data)
}

export function getMinutesByRequirement(requirementId) {
  return request.get(`/meetings/requirement/${requirementId}`)
}

export function getMinutes(params) {
  return request.get('/meetings', { params })
}
