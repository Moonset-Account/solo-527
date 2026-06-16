import request from '@/utils/request'

export function getCourtPage(params) {
  return request({
    url: '/court/page',
    method: 'get',
    params
  })
}

export function getCourtList(status) {
  return request({
    url: '/court/list',
    method: 'get',
    params: { status }
  })
}

export function getCourtDetail(id) {
  return request({
    url: `/court/${id}`,
    method: 'get'
  })
}
