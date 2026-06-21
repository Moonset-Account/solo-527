import request from './request'

export function getMembers(params) {
  return request.get('/members', { params })
}

export function getMember(id) {
  return request.get(`/members/${id}`)
}

export function createMember(data) {
  return request.post('/members', data)
}

export function updateMember(id, data) {
  return request.put(`/members/${id}`, data)
}

export function deleteMember(id) {
  return request.delete(`/members/${id}`)
}

export function getMemberTreatments(memberId) {
  return request.get(`/members/${memberId}/treatments`)
}
