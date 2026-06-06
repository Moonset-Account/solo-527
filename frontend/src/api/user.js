import api from './index'

export const login = (data) => api.post('/auth/login', data)
export const register = (data) => api.post('/auth/register', data)
export const getCurrentUser = () => api.get('/auth/me')
export const logout = () => api.post('/auth/logout')

export const getProducts = (params) => api.get('/products/public', { params })
export const getProductCategories = () => api.get('/products/categories')
export const getBuildings = () => api.get('/buildings/public')

export const getMyOrders = (params) => api.get('/orders/my', { params })
export const getOrderDetail = (id) => api.get(`/orders/${id}`)
export const createOrder = (data) => api.post('/orders', data)
export const cancelOrder = (id) => api.post(`/orders/${id}/cancel`)

export const getMyShortages = (params) => api.get('/shortages/my', { params })
export const confirmShortage = (id, data) => api.post(`/shortages/${id}/confirm`, data)

export const getMyRefunds = (params) => api.get('/refunds/my', { params })
export const createRefund = (data) => api.post('/refunds', data)
export const withdrawRefund = (id) => api.post(`/refunds/${id}/withdraw`)

export const getSavedFilters = (params) => api.get('/filters', { params })
export const saveFilter = (data) => api.post('/filters', data)
export const deleteFilter = (id) => api.delete(`/filters/${id}`)
