import request from '@/utils/request'

export function getAvailableSlots(courtId, date) {
  return request({
    url: '/booking/available-slots',
    method: 'get',
    params: { courtId, date }
  })
}

export function createBooking(data) {
  return request({
    url: '/booking',
    method: 'post',
    data
  })
}

export function getMyBookings(params) {
  return request({
    url: '/booking/my',
    method: 'get',
    params
  })
}

export function cancelBooking(id) {
  return request({
    url: `/booking/cancel/${id}`,
    method: 'put'
  })
}

export function getBookingDetail(id) {
  return request({
    url: `/booking/${id}`,
    method: 'get'
  })
}
