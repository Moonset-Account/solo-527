import request from './request'

export function getProducts(params) {
  return request.get('/products', { params })
}

export function getProduct(id) {
  return request.get(`/products/${id}`)
}

export function createProduct(data) {
  return request.post('/products', data)
}

export function updateProduct(id, data) {
  return request.put(`/products/${id}`, data)
}

export function deleteProduct(id) {
  return request.delete(`/products/${id}`)
}

export function getStockSummary() {
  return request.get('/products/stock/summary')
}

export function adjustStock(id, data) {
  return request.post(`/products/${id}/stock/adjust`, data)
}
