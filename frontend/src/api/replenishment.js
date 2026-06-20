import request from './request'

export const getReplenishmentList = (params) => {
  return request({
    url: '/replenishment',
    method: 'get',
    params
  })
}

export const createReplenishment = (data) => {
  return request({
    url: '/replenishment',
    method: 'post',
    data
  })
}

export const updateReplenishment = (id, data) => {
  return request({
    url: `/replenishment/${id}`,
    method: 'put',
    data
  })
}

export const deleteReplenishment = (id) => {
  return request({
    url: `/replenishment/${id}`,
    method: 'delete'
  })
}

export const approveReplenishment = (id, data) => {
  return request({
    url: `/replenishment/${id}/approve`,
    method: 'post',
    data
  })
}
