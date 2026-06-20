import request from './request'

export const getDashboardStats = () => {
  return request({
    url: '/dashboard/stats',
    method: 'get'
  })
}

export const getInventoryTrend = (params) => {
  return request({
    url: '/dashboard/inventory-trend',
    method: 'get',
    params
  })
}

export const getWarehouseDistribution = () => {
  return request({
    url: '/dashboard/warehouse-distribution',
    method: 'get'
  })
}

export const getTopProducts = (params) => {
  return request({
    url: '/dashboard/top-products',
    method: 'get',
    params
  })
}

export const getRecentActivities = (params) => {
  return request({
    url: '/dashboard/recent-activities',
    method: 'get',
    params
  })
}

export const getSafetyStock = (params) => {
  return request({
    url: '/dashboard/safety-stock',
    method: 'get',
    params
  })
}

export const getHighRiskMedicines = (params) => {
  return request({
    url: '/dashboard/high-risk-medicines',
    method: 'get',
    params
  })
}

export const getCategoryStock = () => {
  return request({
    url: '/dashboard/category-stock',
    method: 'get'
  })
}

export const getStockoutTrend = (params) => {
  return request({
    url: '/dashboard/stockout-trend',
    method: 'get',
    params
  })
}
