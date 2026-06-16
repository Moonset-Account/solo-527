import request from '@/utils/request'

export function getDraftList(params) {
  return request({
    url: '/email-drafts',
    method: 'get',
    params
  })
}

export function getDraft(id) {
  return request({
    url: `/email-drafts/${id}`,
    method: 'get'
  })
}

export function createDraft(data) {
  return request({
    url: '/email-drafts',
    method: 'post',
    data
  })
}

export function updateDraft(id, data) {
  return request({
    url: `/email-drafts/${id}`,
    method: 'put',
    data
  })
}

export function deleteDraft(id) {
  return request({
    url: `/email-drafts/${id}`,
    method: 'delete'
  })
}

export function saveVersion(id, data) {
  return request({
    url: `/email-drafts/${id}/versions`,
    method: 'post',
    data
  })
}

export function getVersionList(id) {
  return request({
    url: `/email-drafts/${id}/versions`,
    method: 'get'
  })
}

export function getVersion(id, versionId) {
  return request({
    url: `/email-drafts/${id}/versions/${versionId}`,
    method: 'get'
  })
}

export function restoreVersion(id, versionId) {
  return request({
    url: `/email-drafts/${id}/versions/${versionId}/restore`,
    method: 'post'
  })
}

export function submitForReview(id, data) {
  return request({
    url: `/email-drafts/${id}/submit`,
    method: 'post',
    data
  })
}

export function sendEmail(id, data) {
  return request({
    url: `/email-drafts/${id}/send`,
    method: 'post',
    data
  })
}

export function generateEmail(data) {
  return request({
    url: '/email-drafts/generate',
    method: 'post',
    data
  })
}
