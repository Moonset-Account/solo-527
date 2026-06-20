import request from './request'

export const getExceptionList = (params) => {
  return request({
    url: '/exception',
    method: 'get',
    params
  })
}

export const handleException = (id, data) => {
  return request({
    url: `/exception/${id}/handle`,
    method: 'post',
    data
  })
}

export const getExceptionDetail = (id) => {
  return request({
    url: `/exception/${id}`,
    method: 'get'
  })
}

export const getExceptionStats = () => {
  return request({
    url: '/exception/stats',
    method: 'get'
  })
}

export const assignException = (id, data) => {
  return request({
    url: `/exception/${id}/assign`,
    method: 'post',
    data
  })
}

export const resolveException = (id, data) => {
  return request({
    url: `/exception/${id}/resolve`,
    method: 'post',
    data
  })
}
