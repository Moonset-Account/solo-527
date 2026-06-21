import request from './request'

export function getReminders(params) {
  return request.get('/reminders', { params })
}

export function getReminder(id) {
  return request.get(`/reminders/${id}`)
}

export function getReminderStats() {
  return request.get('/reminders/stats/summary')
}

export function handleAllReminders() {
  return request.post('/reminders/bulk-handle')
}

export function createReminder(data) {
  return request.post('/reminders', data)
}

export function updateReminder(id, data) {
  return request.put(`/reminders/${id}`, data)
}

export function handleReminder(id, data) {
  return request.post(`/reminders/${id}/handle`, data)
}

export function deleteReminder(id) {
  return request.delete(`/reminders/${id}`)
}

export function generateReminders() {
  return request.post('/reminders/generate')
}
