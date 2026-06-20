import request from '../utils/request'

export const getExceptionList = (params) => {
  return request({
    url: '/exceptions',
    method: 'get',
    params,
  })
}

export const getExceptionDetail = (id) => {
  return request({
    url: `/exceptions/${id}`,
    method: 'get',
  })
}

export const createException = (data) => {
  return request({
    url: '/exceptions',
    method: 'post',
    data,
  })
}

export const updateException = (id, data) => {
  return request({
    url: `/exceptions/${id}`,
    method: 'put',
    data,
  })
}

export const deleteException = (id) => {
  return request({
    url: `/exceptions/${id}`,
    method: 'delete',
  })
}

export const resolveException = (id, overdueReason, handlingCostMinutes) => {
  return request({
    url: `/exceptions/${id}/resolve`,
    method: 'post',
    data: { overdueReason, handlingCostMinutes },
  })
}
