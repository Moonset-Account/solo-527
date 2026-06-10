import request from './request'

export const getDashboard = () => request.get<any, any>('/dashboard')

export const getConversion = (params?: { days?: number }) =>
  request.get<any, any>('/dashboard/conversion', { params })

export const getNoShowTrend = (params?: { months?: number }) =>
  request.get<any, any>('/dashboard/no-show-trend', { params })
