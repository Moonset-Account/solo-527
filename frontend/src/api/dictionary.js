import request from '@/utils/request'

export function getDictionary(params) {
  return request.get('/dictionary', { params })
}

export function getDictionaryByType(dictType) {
  return request.get(`/dictionary/type/${dictType}`)
}

export function getDictionaryItem(id) {
  return request.get(`/dictionary/${id}`)
}

export function createDictionaryItem(data) {
  return request.post('/dictionary', data)
}

export function updateDictionaryItem(id, data) {
  return request.patch(`/dictionary/${id}`, data)
}

export function deleteDictionaryItem(id) {
  return request.delete(`/dictionary/${id}`)
}

export function batchCreateDictionary(items) {
  return request.post('/dictionary/batch', items)
}

export function getDictTypes() {
  return request.get('/dictionary/types')
}
