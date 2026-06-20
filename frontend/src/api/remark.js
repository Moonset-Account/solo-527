import request from '../utils/request'

export const getRemarksByLead = (leadId) => {
  return request({
    url: `/remarks/lead/${leadId}`,
    method: 'get',
  })
}

export const createRemark = (leadId, content) => {
  return request({
    url: `/remarks/lead/${leadId}`,
    method: 'post',
    data: { content },
  })
}

export const updateRemark = (id, content) => {
  return request({
    url: `/remarks/${id}`,
    method: 'put',
    data: { content },
  })
}

export const deleteRemark = (id) => {
  return request({
    url: `/remarks/${id}`,
    method: 'delete',
  })
}
