import request from './index'

export function createRule(data) {
  return request.post('/reminders', data)
}

export function updateRule(id, data) {
  return request.put(`/reminders/${id}`, data)
}

export function deleteRule(id) {
  return request.delete(`/reminders/${id}`)
}

export function getRules(params) {
  return request.get('/reminders', { params })
}
