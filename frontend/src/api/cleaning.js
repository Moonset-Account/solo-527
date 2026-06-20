import request from '@/utils/request'

export const getCleaningTasks = (params) => {
  return request.get('/cleaning-tasks', { params })
}

export const getCleaningTask = (id) => {
  return request.get(`/cleaning-tasks/${id}`)
}

export const createCleaningTask = (data) => {
  return request.post('/cleaning-tasks', data)
}

export const updateCleaningTask = (id, data) => {
  return request.put(`/cleaning-tasks/${id}`, data)
}

export const deleteCleaningTask = (id) => {
  return request.delete(`/cleaning-tasks/${id}`)
}
