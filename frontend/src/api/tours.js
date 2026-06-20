import request from '@/utils/request'

export const getTours = (params) => {
  return request.get('/tours', { params })
}

export const getTour = (id) => {
  return request.get(`/tours/${id}`)
}

export const createTour = (data) => {
  return request.post('/tours', data)
}

export const updateTour = (id, data) => {
  return request.put(`/tours/${id}`, data)
}

export const deleteTour = (id) => {
  return request.delete(`/tours/${id}`)
}

export const getSchedules = (params) => {
  return request.get('/schedules', { params })
}

export const createSchedule = (data) => {
  return request.post('/schedules', data)
}

export const updateSchedule = (id, data) => {
  return request.put(`/schedules/${id}`, data)
}
