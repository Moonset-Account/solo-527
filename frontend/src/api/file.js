import request from '@/utils/request'

export function uploadFile(file, bizType, bizId) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('bizType', bizType)
  formData.append('bizId', bizId)

  return request({
    url: '/files/upload',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export function getAttachments(bizType, bizId) {
  return request({
    url: '/files',
    method: 'get',
    params: { bizType, bizId }
  })
}

export function deleteAttachment(id) {
  return request({
    url: `/files/${id}`,
    method: 'delete'
  })
}
