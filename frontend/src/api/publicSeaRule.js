import request from '../utils/request'

export const getPublicSeaRules = () => {
  return request({
    url: '/public-sea-rules',
    method: 'get',
  })
}

export const getEnabledPublicSeaRules = () => {
  return request({
    url: '/public-sea-rules/enabled',
    method: 'get',
  })
}

export const createPublicSeaRule = (data) => {
  return request({
    url: '/public-sea-rules',
    method: 'post',
    data,
  })
}

export const updatePublicSeaRule = (id, data) => {
  return request({
    url: `/public-sea-rules/${id}`,
    method: 'put',
    data,
  })
}

export const deletePublicSeaRule = (id) => {
  return request({
    url: `/public-sea-rules/${id}`,
    method: 'delete',
  })
}
