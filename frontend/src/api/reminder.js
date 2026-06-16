import request from './index'

export function createRule(data) {
  return request.post('/reminders/rules', data)
}

export function updateRule(id, data) {
  return request.put(`/reminders/rules/${id}`, data)
}

export function deleteRule(id) {
  return request.delete(`/reminders/rules/${id}`)
}

export function getRules(params) {
  return request.get('/reminders/rules', { params })
}
