import request from './request'

export function getRiderList(params) {
  return request.get('/riders/list', { params })
}

export function getRiderById(id) {
  return request.get(`/riders/${id}`)
}
