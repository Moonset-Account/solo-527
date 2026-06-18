import request from '@/utils/request'
import type { PageResult } from '@/utils/request'

export function getBusinessDetail(anomalyId: string) {
  return request.get(`/business-details/${anomalyId}`)
}

export function updateBusinessDetail(anomalyId: string, data: any) {
  return request.patch(`/business-details/${anomalyId}`, data)
}

export function getBusinessHistory(anomalyId: string) {
  return request.get(`/business-details/${anomalyId}/history`)
}

export function addComment(anomalyId: string, data: { content: string; mentions?: string[] }) {
  return request.post(`/business-details/${anomalyId}/comments`, data)
}

export function deleteComment(anomalyId: string, commentId: string) {
  return request.delete(`/business-details/${anomalyId}/comments/${commentId}`)
}

export function uploadAttachment(anomalyId: string, file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return request.post(`/business-details/${anomalyId}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export function deleteAttachment(anomalyId: string, attachmentId: string) {
  return request.delete(`/business-details/${anomalyId}/attachments/${attachmentId}`)
}
