import request from '@/utils/request'

export function getPaymentProgress(params) {
  return request({
    url: '/reports/payment-progress',
    method: 'get',
    params
  })
}

export function getPaymentProgressDetail(contractId) {
  return request({
    url: `/reports/payment-progress/${contractId}`,
    method: 'get'
  })
}

export function getDealPrediction() {
  return request({
    url: '/reports/deal-prediction',
    method: 'get'
  })
}

export function getDashboard() {
  return request({
    url: '/reports/dashboard',
    method: 'get'
  })
}
