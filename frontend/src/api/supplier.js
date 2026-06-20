import request from './request'

export const getSupplierList = (params) => {
  return request({
    url: '/supplier',
    method: 'get',
    params
  })
}

export const createSupplier = (data) => {
  return request({
    url: '/supplier',
    method: 'post',
    data
  })
}

export const updateSupplier = (id, data) => {
  return request({
    url: `/supplier/${id}`,
    method: 'put',
    data
  })
}

export const deleteSupplier = (id) => {
  return request({
    url: `/supplier/${id}`,
    method: 'delete'
  })
}

export const getSupplierDetail = (id) => {
  return request({
    url: `/supplier/${id}`,
    method: 'get'
  })
}

export const toggleSupplierStatus = (id) => {
  return request({
    url: `/supplier/${id}/status`,
    method: 'patch'
  })
}

export const getSupplierReplyList = (params) => {
  return request({
    url: '/supplier/reply',
    method: 'get',
    params
  })
}

export const getSupplierReplyDetail = (id) => {
  return request({
    url: `/supplier/reply/${id}`,
    method: 'get'
  })
}

export const updateSupplierReplyStatus = (id, data) => {
  return request({
    url: `/supplier/reply/${id}/status`,
    method: 'patch',
    data
  })
}

export const recordSupplierReplyDelay = (id, data) => {
  return request({
    url: `/supplier/reply/${id}/delay`,
    method: 'post',
    data
  })
}

export const confirmSupplierReply = (id, data) => {
  return request({
    url: `/supplier/reply/${id}/confirm`,
    method: 'post',
    data
  })
}
