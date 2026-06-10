import request from '@/utils/request'

export function getTechnicians(params) {
  return request.get('/technicians', { params })
}

export function getActiveTechnicians() {
  return request.get('/technicians/active')
}

export function getTechniciansByService(serviceId) {
  return request.get(`/technicians/service/${serviceId}`)
}

export function getTechnician(id) {
  return request.get(`/technicians/${id}`)
}

export function createTechnician(data) {
  return request.post('/technicians', data)
}

export function updateTechnician(id, data) {
  return request.patch(`/technicians/${id}`, data)
}

export function deleteTechnician(id) {
  return request.delete(`/technicians/${id}`)
}
