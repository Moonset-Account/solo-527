import request from './request'

export function getAppointments(params) {
  return request.get('/appointments', { params })
}

export function getAppointment(id) {
  return request.get(`/appointments/${id}`)
}

export function createAppointment(data) {
  return request.post('/appointments', data)
}

export function updateAppointment(id, data) {
  return request.put(`/appointments/${id}`, data)
}

export function confirmAppointment(id) {
  return request.post(`/appointments/${id}/confirm`)
}

export function completeAppointment(id, data) {
  return request.post(`/appointments/${id}/complete`, data)
}

export function cancelAppointment(id) {
  return request.post(`/appointments/${id}/cancel`)
}

export function deleteAppointment(id) {
  return request.delete(`/appointments/${id}`)
}
