
import request from '../utils/request'

export const getPatients = (params) => request.get('/patients', { params })
export const getPatient = (id) => request.get(`/patients/${id}`)
export const createPatient = (data) => request.post('/patients', data)
export const updatePatient = (id, data) => request.put(`/patients/${id}`, data)
export const getPatientByPhone = (phone) => request.get(`/patients/phone/${phone}`)

export const getDoctors = (params) => request.get('/doctors', { params })
export const getAllDoctors = (clinicId) => request.get('/doctors/all', { params: { clinicId } })
export const getDoctor = (id) => request.get(`/doctors/${id}`)

export const getAppointments = (params) => request.get('/appointments', { params })
export const getAppointment = (id, includeDetails = false) => request.get(`/appointments/${id}`, { params: { includeDetails } })
export const createAppointment = (data) => request.post('/appointments', data)
export const updateAppointmentStatus = (id, status) => request.patch(`/appointments/${id}/status`, status)

export const getScheduleSlots = (params) => request.get('/scheduleslots', { params })
export const getAvailableSlots = (doctorId, date) => request.get(`/scheduleslots/available/${doctorId}`, { params: { date } })
export const getSlotsByDateRange = (params) => request.get('/scheduleslots/range', { params })

export const getFollowUps = (params) => request.get('/followups', { params })
export const getFollowUp = (id) => request.get(`/followups/${id}`)
export const createFollowUp = (data) => request.post('/followups', data)
export const completeFollowUp = (id, data) => request.post(`/followups/${id}/complete`, data)
export const getOverdueFollowUpCount = (responsiblePersonId) => request.get('/followups/overdue/count', { params: { responsiblePersonId } })

export const getTodoItems = (params) => request.get('/todoitems', { params })
export const getTodoItem = (id, includeDetails = true) => request.get(`/todoitems/${id}`, { params: { includeDetails } })
export const createTodoItem = (data) => request.post('/todoitems', data)
export const updateTodoItem = (id, data) => request.put(`/todoitems/${id}`, data)
export const completeTodoItem = (id) => request.post(`/todoitems/${id}/complete`)
export const getPendingTodoCount = (assignedToUserId) => request.get('/todoitems/pending/count', { params: { assignedToUserId } })

export const getDashboardStats = (clinicId) => request.get('/statistics/dashboard', { params: { clinicId } })
export const getRecheckStats = (params) => request.get('/statistics/recheck', { params })
export const getLostPatientStats = (params) => request.get('/statistics/lost-patients', { params })
export const getScheduleUtilizationStats = (params) => request.get('/statistics/schedule-utilization', { params })

export const getExternalApiLogs = (params) => request.get('/externalapilogs', { params })
export const getExternalApiLog = (id) => request.get(`/externalapilogs/${id}`)
export const getApiFailureSummary = (params) => request.get('/externalapilogs/failure-summary', { params })
export const getFailedLogs = (apiName, top) => request.get('/externalapilogs/failed', { params: { apiName, top } })

export const getWorkloadReports = (params) => request.get('/workloadreports', { params })
export const getWorkloadReport = (id) => request.get(`/workloadreports/${id}`)
export const generateWorkloadReport = (doctorId, reportDate) => request.post(`/workloadreports/generate/${doctorId}`, null, { params: { reportDate } })

export const getPrescription = (id) => request.get(`/prescriptions/${id}`)
export const getPrescriptionsByPatient = (patientId) => request.get(`/prescriptions/patient/${patientId}`)
export const getPrescriptionsByAppointment = (appointmentId) => request.get(`/prescriptions/appointment/${appointmentId}`)
export const createPrescription = (data) => request.post('/prescriptions', data)

export const getChiefComplaint = (id) => request.get(`/chiefcomplaints/${id}`)
export const getChiefComplaintsByPatient = (patientId) => request.get(`/chiefcomplaints/patient/${patientId}`)
export const getLatestChiefComplaint = (patientId) => request.get(`/chiefcomplaints/patient/${patientId}/latest`)
export const createChiefComplaint = (data) => request.post('/chiefcomplaints', data)

export const getFeeItemsByAppointment = (appointmentId) => request.get(`/feeitems/appointment/${appointmentId}`)
export const createFeeItem = (data) => request.post('/feeitems', data)
export const updateFeeItemStatus = (id, status) => request.patch(`/feeitems/${id}/status`, status)
export const getTotalFeeAmount = (appointmentId) => request.get(`/feeitems/appointment/${appointmentId}/total`)
