import request from './index'

export function batchImport(data) {
  return request.post('/imports/batch', data)
}

export function batchApprove(data) {
  return request.put('/imports/batch-approve', data)
}

export function getImportErrors(params) {
  return request.get('/imports/errors', { params })
}

export function downloadErrorTemplate() {
  return request.get('/imports/error-template', { responseType: 'blob' })
}
