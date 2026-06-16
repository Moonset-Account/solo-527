import request from './index'

export function batchImport(data) {
  return request.post('/imports/requirements', data)
}

export function batchApprove(data) {
  return request.post('/imports/batch-approve', data)
}

export function getImportErrors(batchNo) {
  return request.get(`/imports/errors/${batchNo}`)
}

export function downloadErrorTemplate(batchNo) {
  return request.get(`/imports/errors/${batchNo}/download`, { responseType: 'blob' })
}
