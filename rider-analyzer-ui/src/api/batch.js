import request from './request'

export function batchImport(formData) {
  return request.post('/batch/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export function batchApprove(batchNo, approved) {
  return request.post('/batch/approve', null, {
    params: { batchNo, approved }
  })
}

export function getBatchList(params) {
  return request.get('/batch/list', { params })
}

export function downloadErrors(batchNo) {
  return request.get(`/batch/errors/${batchNo}/download`, {
    responseType: 'blob'
  })
}
