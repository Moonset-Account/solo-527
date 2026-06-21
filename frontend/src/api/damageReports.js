import request from './request'

export function getDamageReports(params) {
  return request.get('/damage-reports', { params })
}

export function getDamageReport(id) {
  return request.get(`/damage-reports/${id}`)
}

export function createDamageReport(data) {
  return request.post('/damage-reports', data)
}

export function updateDamageReport(id, data) {
  return request.put(`/damage-reports/${id}`, data)
}

export function approveDamageReport(id) {
  return request.post(`/damage-reports/${id}/approve`)
}

export function rejectDamageReport(id, data) {
  return request.post(`/damage-reports/${id}/reject`, data)
}

export function deleteDamageReport(id) {
  return request.delete(`/damage-reports/${id}`)
}
