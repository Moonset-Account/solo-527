import request from '@/utils/request'

export function getBooks(params) {
  return request({
    url: '/books/',
    method: 'get',
    params
  })
}

export function getBook(id) {
  return request({
    url: `/books/${id}/`,
    method: 'get'
  })
}

export function createBook(data) {
  return request({
    url: '/books/',
    method: 'post',
    data
  })
}

export function updateBook(id, data) {
  return request({
    url: `/books/${id}/`,
    method: 'put',
    data
  })
}

export function markBookDamaged(id, data) {
  return request({
    url: `/books/${id}/mark_damaged/`,
    method: 'post',
    data
  })
}
