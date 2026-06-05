import request from '@/utils/request'

export function getMyMessages(params) {
  return request({
    url: '/messages',
    method: 'get',
    params
  })
}

export function markAsRead(id) {
  return request({
    url: `/messages/${id}/read`,
    method: 'post'
  })
}

export function getUnreadCount() {
  return request({
    url: '/messages/unread/count',
    method: 'get'
  })
}
