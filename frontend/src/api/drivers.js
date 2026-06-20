import request from '@/utils/request'

export const getDrivers = (params) => {
  return request.get('/drivers', { params })
}

export const getDriver = (id) => {
  return request.get(`/drivers/${id}`)
}

export const createDriver = (data) => {
  return request.post('/drivers', data)
}

export const updateDriver = (id, data) => {
  return request.put(`/drivers/${id}`, data)
}

export const deleteDriver = (id) => {
  return request.delete(`/drivers/${id}`)
}
