import request from '@/utils/request'

export function getAppointments(params) {
  return request.get('/appointments', { params })
}

export function getAppointment(id) {
  return request.get(`/appointments/${id}`)
}

export function createAppointment(data) {
  return request.post('/appointments', data)
}

export function createPublicAppointment(data) {
  return request.post('/appointments/public', data)
}

export function updateAppointment(id, data) {
  return request.patch(`/appointments/${id}`, data)
}

export function rescheduleAppointment(id, data) {
  return request.patch(`/appointments/${id}/reschedule`, data)
}

export function cancelAppointment(id) {
  return request.patch(`/appointments/${id}/cancel`)
}

export function checkInAppointment(id) {
  return request.patch(`/appointments/${id}/checkin`)
}

export function completeAppointment(id) {
  return request.patch(`/appointments/${id}/complete`)
}

export function deleteAppointment(id) {
  return request.delete(`/appointments/${id}`)
}

export function getAvailableTimeSlots(technicianId, date, duration) {
  return request.get('/appointments/available-slots', {
    params: { technicianId, date, duration },
  })
}

export function getTodayAppointmentCount() {
  return request.get('/appointments/today/count')
}
