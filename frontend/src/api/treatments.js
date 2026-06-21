import request from './request'

export function getTreatments(params) {
  return request.get('/treatments', { params })
}

export function getTreatment(id) {
  return request.get(`/treatments/${id}`)
}

export function createTreatment(data) {
  return request.post('/treatments', data)
}

export function updateTreatment(id, data) {
  return request.put(`/treatments/${id}`, data)
}

export function deleteTreatment(id) {
  return request.delete(`/treatments/${id}`)
}
