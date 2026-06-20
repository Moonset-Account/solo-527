import request from '../utils/request'

export const getAttachmentsByLead = (leadId) => {
  return request({
    url: `/attachments/lead/${leadId}`,
    method: 'get',
  })
}

export const uploadAttachment = (file, leadId, category = '其他') => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('leadId', leadId)
  formData.append('category', category)
  return request({
    url: '/attachments/upload',
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const deleteAttachment = (id) => {
  return request({
    url: `/attachments/${id}`,
    method: 'delete',
  })
}
