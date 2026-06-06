import request from '@/utils/request'

export function getLibrarianDashboard() {
  return request({
    url: '/dashboard/librarian/',
    method: 'get'
  })
}
