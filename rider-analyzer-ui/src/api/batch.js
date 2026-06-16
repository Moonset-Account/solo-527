import request from './request'

export function batchImport(data) {
  return request.post('/batch/import', data)
}

export function batchApprove(data) {
  return request.post('/batch/approve', data)
}

export function downloadErrors(batchId) {
  return request.get(`/batch/${batchId}/errors`, { responseType: 'blob' })
}
