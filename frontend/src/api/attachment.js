import request from '../utils/request'

export const getAttachmentsByLead = (leadId) => {
  return request({
    url: `/attachments/lead/${leadId}`,
    method: 'get',
  })
}

export const createAttachment = (data) => {
  return request({
    url: '/attachments',
    method: 'post',
    data,
  })
}

export const deleteAttachment = (id) => {
  return request({
    url: `/attachments/${id}`,
    method: 'delete',
  })
}
