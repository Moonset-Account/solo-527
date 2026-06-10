import request from '@/utils/request'

export function getMemberships(params) {
  return request.get('/memberships', { params })
}

export function getActiveMemberships() {
  return request.get('/memberships/active')
}

export function getMembership(id) {
  return request.get(`/memberships/${id}`)
}

export function createMembership(data) {
  return request.post('/memberships', data)
}

export function updateMembership(id, data) {
  return request.patch(`/memberships/${id}`, data)
}

export function deleteMembership(id) {
  return request.delete(`/memberships/${id}`)
}

export function sellMembership(data) {
  return request.post('/memberships/sell', data)
}

export function getCustomerMemberships(customerId) {
  return request.get(`/memberships/customer/${customerId}`)
}

export function getAllCustomerMemberships(params) {
  return request.get('/memberships/customer-memberships/list', { params })
}

export function useCustomerMembership(id, data) {
  return request.patch(`/memberships/customer-memberships/${id}/use`, data)
}

export function getCustomerMembershipById(id) {
  return request.get(`/memberships/customer-memberships/${id}`)
}
