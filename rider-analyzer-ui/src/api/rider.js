import request from './request'

export function getRiderList(params) {
  return request.get('/riders', { params })
}
