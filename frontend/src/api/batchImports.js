import request from './request'

export function getBatchImports(params) {
  return request.get('/batch-imports', { params })
}

export function getBatchImport(id) {
  return request.get(`/batch-imports/${id}`)
}

export function uploadBatchImport(file, type) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', type)
  return request.post('/batch-imports', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export function deleteBatchImport(id) {
  return request.delete(`/batch-imports/${id}`)
}

export function downloadErrors(id) {
  return request.get(`/batch-imports/${id}/errors/download`, {
    responseType: 'blob'
  })
}

export function retryBatchImport(id) {
  return request.post(`/batch-imports/${id}/retry`)
}
