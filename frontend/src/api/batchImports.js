import request from './request'
import axios from 'axios'

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
  const token = localStorage.getItem('token')
  return axios.get(`/api/batch-imports/${id}/errors/download`, {
    responseType: 'blob',
    headers: {
      Authorization: token ? `Bearer ${token}` : ''
    }
  })
}

export function retryBatchImport(id) {
  return request.post(`/batch-imports/${id}/retry`)
}
