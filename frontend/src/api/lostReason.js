import request from '../utils/request'

export const getLostReasons = () => {
  return request({
    url: '/lost-reasons',
    method: 'get',
  })
}

export const getEnabledLostReasons = () => {
  return request({
    url: '/lost-reasons/enabled',
    method: 'get',
  })
}

export const createLostReason = (data) => {
  return request({
    url: '/lost-reasons',
    method: 'post',
    data,
  })
}

export const updateLostReason = (id, data) => {
  return request({
    url: `/lost-reasons/${id}`,
    method: 'put',
    data,
  })
}

export const deleteLostReason = (id) => {
  return request({
    url: `/lost-reasons/${id}`,
    method: 'delete',
  })
}
