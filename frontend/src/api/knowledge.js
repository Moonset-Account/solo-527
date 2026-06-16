import request from '@/utils/request'

export function getKnowledgeList(params) {
  return request({
    url: '/knowledge',
    method: 'get',
    params
  })
}

export function getKnowledge(id) {
  return request({
    url: `/knowledge/${id}`,
    method: 'get'
  })
}

export function createKnowledge(data) {
  return request({
    url: '/knowledge',
    method: 'post',
    data
  })
}

export function updateKnowledge(id, data) {
  return request({
    url: `/knowledge/${id}`,
    method: 'put',
    data
  })
}

export function deleteKnowledge(id) {
  return request({
    url: `/knowledge/${id}`,
    method: 'delete'
  })
}

export function uploadKnowledgeFile(file, data) {
  const formData = new FormData()
  formData.append('file', file)
  if (data) {
    Object.keys(data).forEach(key => {
      formData.append(key, data[key])
    })
  }
  return request({
    url: '/knowledge/upload',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export function getKnowledgeCategories() {
  return request({
    url: '/knowledge/categories',
    method: 'get'
  })
}

export function syncKnowledge(id) {
  return request({
    url: `/knowledge/${id}/sync`,
    method: 'post'
  })
}

export function searchKnowledge(params) {
  return request({
    url: '/knowledge/search',
    method: 'get',
    params
  })
}
