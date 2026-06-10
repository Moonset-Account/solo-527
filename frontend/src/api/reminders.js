import request from '@/utils/request'

export function getReminderRules(params) {
  return request.get('/reminders/rules', { params })
}

export function getReminderRule(id) {
  return request.get(`/reminders/rules/${id}`)
}

export function createReminderRule(data) {
  return request.post('/reminders/rules', data)
}

export function updateReminderRule(id, data) {
  return request.patch(`/reminders/rules/${id}`, data)
}

export function deleteReminderRule(id) {
  return request.delete(`/reminders/rules/${id}`)
}

export function toggleReminderRule(id, enabled) {
  return request.patch(`/reminders/rules/${id}/toggle`, { enabled })
}

export function getRemindersByCategory(category) {
  return request.get(`/reminders/rules/category/${category}`)
}

export function getAllReminders() {
  return request.get('/reminders/rules/list')
}
