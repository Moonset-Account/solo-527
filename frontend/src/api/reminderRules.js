import request from './request'

export function getReminderRules(params) {
  return request.get('/reminder-rules', { params })
}

export function getReminderRule(id) {
  return request.get(`/reminder-rules/${id}`)
}

export function createReminderRule(data) {
  return request.post('/reminder-rules', data)
}

export function updateReminderRule(id, data) {
  return request.put(`/reminder-rules/${id}`, data)
}

export function deleteReminderRule(id) {
  return request.delete(`/reminder-rules/${id}`)
}

export function toggleReminderRule(id) {
  return request.post(`/reminder-rules/${id}/toggle`)
}
