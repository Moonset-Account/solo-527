import request from '@/utils/request'

export const getReminders = (params) => {
  return request.get('/reminders', { params })
}

export const getUnreadCount = () => {
  return request.get('/reminders/unread-count')
}

export const markAsRead = (id) => {
  return request.post(`/reminders/${id}/read`)
}

export const markAllAsRead = () => {
  return request.post('/reminders/read-all')
}

export const getReminderRules = (params) => {
  return request.get('/reminder-rules', { params })
}

export const createReminderRule = (data) => {
  return request.post('/reminder-rules', data)
}

export const updateReminderRule = (id, data) => {
  return request.put(`/reminder-rules/${id}`, data)
}

export const deleteReminderRule = (id) => {
  return request.delete(`/reminder-rules/${id}`)
}

export const triggerDriverDelay = (scheduleId, delayMinutes) => {
  return request.post('/reminders/trigger-driver-delay', { scheduleId, delayMinutes })
}
