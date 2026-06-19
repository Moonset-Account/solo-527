import request from '@/utils/request'

export function uploadAttachment(data) {
  return request({
    url: '/attachments/upload',
    method: 'post',
    data,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export function getAttachmentList(bizType, bizId) {
  return request({
    url: '/attachments',
    method: 'get',
    params: { bizType, bizId }
  })
}

export function deleteAttachment(id) {
  return request({
    url: `/attachments/${id}`,
    method: 'delete'
  })
}

export function getAttachmentUrl(filePath) {
  return `/uploads/${filePath}`
}
