import request from '@/utils/request'

export function createPayment(data) {
  return request({
    url: '/payment',
    method: 'post',
    data
  })
}

export function mockPay(payNo) {
  return request({
    url: `/payment/mock-pay/${payNo}`,
    method: 'post'
  })
}

export function getPaymentByPayNo(payNo) {
  return request({
    url: `/payment/${payNo}`,
    method: 'get'
  })
}

export function getPaymentByBookingId(bookingId) {
  return request({
    url: `/payment/booking/${bookingId}`,
    method: 'get'
  })
}

export function getPaymentStatus(bookingId) {
  return request({
    url: `/payment/status/${bookingId}`,
    method: 'get'
  })
}
