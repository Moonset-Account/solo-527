import request from '../utils/request'

export const getAllTags = () => {
  return request({
    url: '/tags',
    method: 'get',
  })
}

export const getTagsByCategory = (category) => {
  return request({
    url: `/tags/category/${category}`,
    method: 'get',
  })
}

export const createTag = (data) => {
  return request({
    url: '/tags',
    method: 'post',
    data,
  })
}

export const updateTag = (id, data) => {
  return request({
    url: `/tags/${id}`,
    method: 'put',
    data,
  })
}

export const deleteTag = (id) => {
  return request({
    url: `/tags/${id}`,
    method: 'delete',
  })
}
