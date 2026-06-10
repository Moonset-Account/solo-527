import request from '@/utils/request'

export function getServices(params) {
  return request.get('/services', { params })
}

export function getActiveServices() {
  return request.get('/services/active')
}

export function getService(id) {
  return request.get(`/services/${id}`)
}

export function createService(data) {
  return request.post('/services', data)
}

export function updateService(id, data) {
  return request.patch(`/services/${id}`, data)
}

export function deleteService(id) {
  return request.delete(`/services/${id}`)
}
