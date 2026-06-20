import request from '../utils/request'

export const getLeadList = (params) => {
  return request({
    url: '/leads',
    method: 'get',
    params,
  })
}

export const getLeadDetail = (id) => {
  return request({
    url: `/leads/${id}`,
    method: 'get',
  })
}

export const createLead = (data) => {
  return request({
    url: '/leads',
    method: 'post',
    data,
  })
}

export const updateLead = (id, data) => {
  return request({
    url: `/leads/${id}`,
    method: 'put',
    data,
  })
}

export const deleteLead = (id) => {
  return request({
    url: `/leads/${id}`,
    method: 'delete',
  })
}

export const assignOwner = (id, ownerId) => {
  return request({
    url: `/leads/${id}/owner`,
    method: 'put',
    data: { ownerId },
  })
}

export const updateLevel = (id, level) => {
  return request({
    url: `/leads/${id}/level`,
    method: 'put',
    data: { level },
  })
}

export const updateStatus = (id, status) => {
  return request({
    url: `/leads/${id}/status`,
    method: 'put',
    data: { status },
  })
}

export const getLeadTags = (id) => {
  return request({
    url: `/leads/${id}/tags`,
    method: 'get',
  })
}

export const addLeadTags = (id, tagIds) => {
  return request({
    url: `/leads/${id}/tags`,
    method: 'post',
    data: { tagIds },
  })
}

export const removeLeadTags = (id, tagIds) => {
  return request({
    url: `/leads/${id}/tags`,
    method: 'delete',
    data: { tagIds },
  })
}

export const claimLead = (id) => {
  return request({
    url: `/leads/${id}/claim`,
    method: 'post',
  })
}

export const releaseLead = (id) => {
  return request({
    url: `/leads/${id}/release`,
    method: 'post',
  })
}

export const markLost = (id, lostReasonId, remark) => {
  return request({
    url: `/leads/${id}/lost`,
    method: 'post',
    data: { lostReasonId, remark },
  })
}
