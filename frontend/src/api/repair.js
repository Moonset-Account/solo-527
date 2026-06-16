import request from '@/utils/request'

export function getRepairPage(params) {
  return request({
    url: '/repair/page',
    method: 'get',
    params
  })
}

export function getRepairById(id) {
  return request({
    url: `/repair/${id}`,
    method: 'get'
  })
}

export function createRepair(data) {
  return request({
    url: '/repair',
    method: 'post',
    data
  })
}

export function assignRepairer(id, repairerId) {
  return request({
    url: `/repair/${id}/assign`,
    method: 'put',
    params: { repairerId }
  })
}

export function updateRepairStatus(id, status, data) {
  return request({
    url: `/repair/${id}/status`,
    method: 'put',
    params: { status },
    data
  })
}
