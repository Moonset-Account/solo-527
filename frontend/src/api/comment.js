import request from './index'

export function addComment(data) {
  return request.post('/comments', data)
}

export function getCommentsByRequirement(requirementId) {
  return request.get(`/comments/requirement/${requirementId}`)
}
