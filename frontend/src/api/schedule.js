import request from '@/utils/request'

export function getSchedules(params) {
  return request.get('/schedules', { params })
}

export function getSchedule(id) {
  return request.get(`/schedules/${id}`)
}

export function createSchedule(data) {
  return request.post('/schedules', data)
}

export function updateSchedule(id, data) {
  return request.patch(`/schedules/${id}`, data)
}

export function deleteSchedule(id) {
  return request.delete(`/schedules/${id}`)
}

export function batchCreateSchedules(data) {
  return request.post('/schedules/batch', data)
}

export function getWeekSchedule(technicianId, weekStart) {
  return request.get(`/schedules/technician/${technicianId}/week`, {
    params: { weekStart },
  })
}

export function getScheduleByRange(technicianId, startDate, endDate) {
  return request.get(`/schedules/technician/${technicianId}/range`, {
    params: { startDate, endDate },
  })
}
