import request from './request'

export function getConsultants(params) {
  return request.get('/consultants', { params })
}

export function getConsultant(id) {
  return request.get(`/consultants/${id}`)
}

export function createConsultant(data) {
  return request.post('/consultants', data)
}

export function updateConsultant(id, data) {
  return request.put(`/consultants/${id}`, data)
}

export function deleteConsultant(id) {
  return request.delete(`/consultants/${id}`)
}

export function getConsultantCommissions(id, params) {
  return request.get(`/consultants/${id}/commissions`, { params })
}
