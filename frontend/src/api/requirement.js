import request from './index'

export function submitRequirement(data) {
  return request.post('/requirements', data)
}

export function updateRequirement(id, data) {
  return request.put(`/requirements/${id}`, data)
}

export function getRequirement(id) {
  return request.get(`/requirements/${id}`)
}

export function pageRequirements(params) {
  return request.get('/requirements/page', { params })
}

export function completeRequirement(id) {
  return request.put(`/requirements/${id}/complete`)
}

export function batchApprove(data) {
  return request.put('/requirements/batch-approve', data)
}
