import request from './request'

export function getMemberTreatments(params) {
  return request.get('/member-treatments', { params })
}

export function getMemberTreatment(id) {
  return request.get(`/member-treatments/${id}`)
}

export function purchaseTreatment(data) {
  return request.post('/member-treatments', data)
}

export function deductTreatment(id, data) {
  return request.post(`/member-treatments/${id}/deduct`, data)
}

export function getRemainingCount(memberId, treatmentId) {
  return request.get('/member-treatments/remaining', {
    params: { memberId, treatmentId }
  })
}
