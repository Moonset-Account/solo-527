import api from './api'

export const patientApi = {
  list: (params) => api.get('/patients', { params }),
  get: (id) => api.get(`/patients/${id}`),
  create: (data) => api.post('/patients', data),
  update: (id, data) => api.put(`/patients/${id}`, data),
  getHistory: (id) => api.get(`/patients/${id}/history`),
}

export const doctorApi = {
  list: (params) => api.get('/doctors', { params }),
  get: (id) => api.get(`/doctors/${id}`),
  create: (data) => api.post('/doctors', data),
  update: (id, data) => api.put(`/doctors/${id}`, data),
}

export const scheduleApi = {
  list: (params) => api.get('/schedules', { params }),
  get: (id) => api.get(`/schedules/${id}`),
  create: (data) => api.post('/schedules', data),
  update: (id, data) => api.put(`/schedules/${id}`, data),
  createBatch: (data) => api.post('/schedules/batch', data),
  updateSlot: (slotId, data) => api.put(`/schedules/slots/${slotId}`, data),
  getSlotHistory: (slotId) => api.get(`/schedules/slots/${slotId}/history`),
}

export const appointmentApi = {
  list: (params) => api.get('/appointments', { params }),
  get: (id) => api.get(`/appointments/${id}`),
  create: (data) => api.post('/appointments', data),
  update: (id, data) => api.put(`/appointments/${id}`, data),
  getHistory: (id) => api.get(`/appointments/${id}/history`),
  getOperations: (id) => api.get(`/appointments/${id}/operations`),
}

export const recordApi = {
  list: (params) => api.get('/records', { params }),
  get: (id) => api.get(`/records/${id}`),
  create: (data) => api.post('/records', data),
  update: (id, data) => api.put(`/records/${id}`, data),
}

export const followUpApi = {
  list: (params) => api.get('/followups', { params }),
  get: (id) => api.get(`/followups/${id}`),
  create: (data) => api.post('/followups', data),
  update: (id, data) => api.put(`/followups/${id}`, data),
}

export const conflictApi = {
  list: (params) => api.get('/conflicts', { params }),
  get: (id) => api.get(`/conflicts/${id}`),
  create: (data) => api.post('/conflicts', data),
  resolve: (id, data) => api.put(`/conflicts/${id}/resolve`, data),
  dismiss: (id, data) => api.put(`/conflicts/${id}/dismiss`, data),
}

export const statsApi = {
  overview: (params) => api.get('/stats/overview', { params }),
  returnVisit: (params) => api.get('/stats/return-visit', { params }),
  slotUtilization: (params) => api.get('/stats/slot-utilization', { params }),
  doctorRanking: (params) => api.get('/stats/doctors/ranking', { params }),
}

export const clinicApi = {
  list: () => api.get('/clinics'),
  get: (id) => api.get(`/clinics/${id}`),
  create: (data) => api.post('/clinics', data),
}
