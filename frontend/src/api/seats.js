import request from '@/utils/request'

export function getSeatList(params) {
  return request({
    url: '/seats',
    method: 'get',
    params
  })
}

export function getSeatDetail(id) {
  return request({
    url: `/seats/${id}`,
    method: 'get'
  })
}

export function createSeat(data) {
  return request({
    url: '/seats',
    method: 'post',
    data
  })
}

export function updateSeat(id, data) {
  return request({
    url: `/seats/${id}`,
    method: 'put',
    data
  })
}

export function deleteSeat(id) {
  return request({
    url: `/seats/${id}`,
    method: 'delete'
  })
}

export function getIdleSeats(params) {
  return request({
    url: '/seats/idle',
    method: 'get',
    params
  })
}

export function getSeatNotes(seatId, params) {
  return request({
    url: `/seats/${seatId}/notes`,
    method: 'get',
    params
  })
}

export function addSeatNote(seatId, data) {
  return request({
    url: `/seats/${seatId}/notes`,
    method: 'post',
    data
  })
}

export function batchQuerySeats(params) {
  return request({
    url: '/seats/batch-query',
    method: 'get',
    params
  })
}

export function updateIdleStatus(seatId, data) {
  return request({
    url: `/seats/${seatId}/idle-status`,
    method: 'patch',
    data
  })
}
