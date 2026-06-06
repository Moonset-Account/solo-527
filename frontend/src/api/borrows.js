import request from '@/utils/request'

export function getBorrows(params) {
  return request({
    url: '/borrows/',
    method: 'get',
    params
  })
}

export function getMyBorrows() {
  return request({
    url: '/borrows/my_borrows/',
    method: 'get'
  })
}

export function createBorrow(data) {
  return request({
    url: '/borrows/',
    method: 'post',
    data
  })
}

export function returnBook(id) {
  return request({
    url: `/borrows/${id}/return_book/`,
    method: 'post'
  })
}

export function renewBook(id) {
  return request({
    url: `/borrows/${id}/renew/`,
    method: 'post'
  })
}
