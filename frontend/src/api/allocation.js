import request from './request'

export const getAllocationList = (params) => {
  return request({
    url: '/allocation',
    method: 'get',
    params
  })
}

export const createAllocation = (data) => {
  return request({
    url: '/allocation',
    method: 'post',
    data
  })
}

export const updateAllocation = (id, data) => {
  return request({
    url: `/allocation/${id}`,
    method: 'put',
    data
  })
}

export const deleteAllocation = (id) => {
  return request({
    url: `/allocation/${id}`,
    method: 'delete'
  })
}

export const confirmAllocation = (id, data) => {
  return request({
    url: `/allocation/${id}/confirm`,
    method: 'post',
    data
  })
}
