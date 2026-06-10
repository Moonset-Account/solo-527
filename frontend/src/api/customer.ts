import request from './request'

export const getCustomerList = (params?: any) =>
  request.get<any, any>('/customers', { params })

export const getCustomerDetail = (id: number | string) =>
  request.get<any, any>(`/customers/${id}`)

export const createCustomer = (data: any) =>
  request.post<any, any>('/customers', data)

export const updateCustomer = (id: number | string, data: any) =>
  request.put<any, any>(`/customers/${id}`, data)

export const deleteCustomer = (id: number | string) =>
  request.delete<any, any>(`/customers/${id}`)

export const getCustomerBookings = (id: number | string, params?: any) =>
  request.get<any, any>(`/customers/${id}/bookings`, { params })
