import request from './request'

export function createException(data) {
  return request.post('/exceptions', data)
}

export function handleException(id, data) {
  return request.put(`/exceptions/${id}/handle`, data)
}

export function getExceptionList(params) {
  return request.get('/exceptions/list', { params })
}
