import request from '@/utils/request'

export function getCheckinRecords(params) {
  return request.get('/checkin', { params })
}

export function getCheckinRecord(id) {
  return request.get(`/checkin/${id}`)
}

export function getCheckinByAppointment(appointmentId) {
  return request.get(`/checkin/appointment/${appointmentId}`)
}

export function createCheckinFromAppointment(appointment) {
  return request.post('/checkin/from-appointment', { appointment })
}

export function checkin(id) {
  return request.patch(`/checkin/${id}/checkin`)
}

export function completeCheckin(id, data) {
  return request.patch(`/checkin/${id}/complete`, data)
}

export function cancelCheckin(id) {
  return request.patch(`/checkin/${id}/cancel`)
}

export function getTodayCheckinCount() {
  return request.get('/checkin/today/count')
}

export function getTodayCheckinStats() {
  return request.get('/checkin/today/stats')
}
