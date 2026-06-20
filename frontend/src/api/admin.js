import request from './request'

export const getUserList = (params) => {
  return request({
    url: '/admin/users',
    method: 'get',
    params
  })
}

export const createUser = (data) => {
  return request({
    url: '/admin/users',
    method: 'post',
    data
  })
}

export const updateUser = (id, data) => {
  return request({
    url: `/admin/users/${id}`,
    method: 'put',
    data
  })
}

export const deleteUser = (id) => {
  return request({
    url: `/admin/users/${id}`,
    method: 'delete'
  })
}

export const getRoleList = () => {
  return request({
    url: '/admin/roles',
    method: 'get'
  })
}

export const getWarehouseList = (params) => {
  return request({
    url: '/admin/warehouses',
    method: 'get',
    params
  })
}

export const createWarehouse = (data) => {
  return request({
    url: '/admin/warehouses',
    method: 'post',
    data
  })
}

export const updateWarehouse = (id, data) => {
  return request({
    url: `/admin/warehouses/${id}`,
    method: 'put',
    data
  })
}

export const deleteWarehouse = (id) => {
  return request({
    url: `/admin/warehouses/${id}`,
    method: 'delete'
  })
}

export const getProductList = (params) => {
  return request({
    url: '/admin/products',
    method: 'get',
    params
  })
}

export const createProduct = (data) => {
  return request({
    url: '/admin/products',
    method: 'post',
    data
  })
}

export const updateProduct = (id, data) => {
  return request({
    url: `/admin/products/${id}`,
    method: 'put',
    data
  })
}

export const deleteProduct = (id) => {
  return request({
    url: `/admin/products/${id}`,
    method: 'delete'
  })
}

export const resetUserPassword = (id, data) => {
  return request({
    url: `/admin/users/${id}/reset-password`,
    method: 'put',
    data
  })
}

export const getProductInventory = (productId) => {
  return request({
    url: `/admin/products/${productId}/inventory`,
    method: 'get'
  })
}
