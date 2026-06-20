import request from '../utils/request'

export const getFollowUpsByLead = (leadId) => {
  return request({
    url: `/follow-ups/lead/${leadId}`,
    method: 'get',
  })
}

export const createFollowUp = (data) => {
  return request({
    url: '/follow-ups',
    method: 'post',
    data,
  })
}

export const updateFollowUp = (id, data) => {
  return request({
    url: `/follow-ups/${id}`,
    method: 'put',
    data,
  })
}

export const deleteFollowUp = (id) => {
  return request({
    url: `/follow-ups/${id}`,
    method: 'delete',
  })
}
