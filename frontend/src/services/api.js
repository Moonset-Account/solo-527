
import request from '../utils/request'

export const getPatients = (params) =&gt; request.get('/patients', { params })
export const getPatient = (id) =&gt; request.get(`/patients/${id}`)
export const createPatient = (data) =&gt; request.post('/patients', data)
export const updatePatient = (id, data) =&gt; request.put(`/patients/${id}`, data)
export const getPatientByPhone = (phone) =&gt; request.get(`/patients/phone/${phone}`)

export const getDoctors = (params) =&gt; request.get('/doctors', { params })
export const getAllDoctors = (clinicId) =&gt; request.get('/doctors/all', { params: { clinicId } })
export const getDoctor = (id) =&gt; request.get(`/doctors/${id}`)

export const getAppointments = (params) =&gt; request.get('/appointments', { params })
export const getAppointment = (id, includeDetails = false) =&gt; request.get(`/appointments/${id}`, { params: { includeDetails } })
export const createAppointment = (data) =&gt; request.post('/appointments', data)
export const updateAppointmentStatus = (id, status) =&gt; request.patch(`/appointments/${id}/status`, status)

export const getScheduleSlots = (params) =&gt; request.get('/scheduleslots', { params })
export const getAvailableSlots = (doctorId, date) =&gt; request.get(`/scheduleslots/available/${doctorId}`, { params: { date } })
export const getSlotsByDateRange = (params) =&gt; request.get('/scheduleslots/range', { params })

export const getFollowUps = (params) =&gt; request.get('/followups', { params })
export const getFollowUp = (id) =&gt; request.get(`/followups/${id}`)
export const createFollowUp = (data) =&gt; request.post('/followups', data)
export const completeFollowUp = (id, data) =&gt; request.post(`/followups/${id}/complete`, data)
export const getOverdueFollowUpCount = (responsiblePersonId) =&gt; request.get('/followups/overdue/count', { params: { responsiblePersonId } })

export const getTodoItems = (params) =&gt; request.get('/todoitems', { params })
export const getTodoItem = (id, includeDetails = true) =&gt; request.get(`/todoitems/${id}`, { params: { includeDetails } })
export const createTodoItem = (data) =&gt; request.post('/todoitems', data)
export const updateTodoItem = (id, data) =&gt; request.put(`/todoitems/${id}`, data)
export const completeTodoItem = (id) =&gt; request.post(`/todoitems/${id}/complete`)
export const getPendingTodoCount = (assignedToUserId) =&gt; request.get('/todoitems/pending/count', { params: { assignedToUserId } })

export const getDashboardStats = (clinicId) =&gt; request.get('/statistics/dashboard', { params: { clinicId } })
export const getRecheckStats = (params) =&gt; request.get('/statistics/recheck', { params })
export const getLostPatientStats = (params) =&gt; request.get('/statistics/lost-patients', { params })
export const getScheduleUtilizationStats = (params) =&gt; request.get('/statistics/schedule-utilization', { params })

export const getExternalApiLogs = (params) =&gt; request.get('/externalapilogs', { params })
export const getExternalApiLog = (id) =&gt; request.get(`/externalapilogs/${id}`)
export const getApiFailureSummary = (params) =&gt; request.get('/externalapilogs/failure-summary', { params })
export const getFailedLogs = (apiName, top) =&gt; request.get('/externalapilogs/failed', { params: { apiName, top } })

export const getWorkloadReports = (params) =&gt; request.get('/workloadreports', { params })
export const getWorkloadReport = (id) =&gt; request.get(`/workloadreports/${id}`)
export const generateWorkloadReport = (doctorId, reportDate) =&gt; request.post(`/workloadreports/generate/${doctorId}`, null, { params: { reportDate } })

export const getPrescription = (id) =&gt; request.get(`/prescriptions/${id}`)
export const getPrescriptionsByPatient = (patientId) =&gt; request.get(`/prescriptions/patient/${patientId}`)
export const getPrescriptionsByAppointment = (appointmentId) =&gt; request.get(`/prescriptions/appointment/${appointmentId}`)
export const createPrescription = (data) =&gt; request.post('/prescriptions', data)

export const getChiefComplaint = (id) =&gt; request.get(`/chiefcomplaints/${id}`)
export const getChiefComplaintsByPatient = (patientId) =&gt; request.get(`/chiefcomplaints/patient/${patientId}`)
export const getLatestChiefComplaint = (patientId) =&gt; request.get(`/chiefcomplaints/patient/${patientId}/latest`)
export const createChiefComplaint = (data) =&gt; request.post('/chiefcomplaints', data)

export const getFeeItemsByAppointment = (appointmentId) =&gt; request.get(`/feeitems/appointment/${appointmentId}`)
export const createFeeItem = (data) =&gt; request.post('/feeitems', data)
export const updateFeeItemStatus = (id, status) =&gt; request.patch(`/feeitems/${id}/status`, status)
export const getTotalFeeAmount = (appointmentId) =&gt; request.get(`/feeitems/appointment/${appointmentId}/total`)
