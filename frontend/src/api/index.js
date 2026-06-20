import request from '../utils/request'

export const getResidentBills = (residentId, params) =>
  request.get(`/bills/resident/${residentId}`, { params })

export const getResidentBillSummary = (residentId) =>
  request.get(`/bills/resident/${residentId}/summary`)

export const queryBills = (params) =>
  request.get('/bills/query', { params })

export const getPaymentProgress = (params) =>
  request.get('/bills/progress', { params })

export const getBillDetail = (id) =>
  request.get(`/bills/${id}`)

export const payBill = (id, params) =>
  request.post(`/bills/${id}/pay`, null, { params })

export const exportBills = (params) => {
  const queryStr = new URLSearchParams(params).toString()
  window.open(`/api/bills/export?${queryStr}`, '_blank')
}

export const getWorkOrders = (params) =>
  request.get('/work-orders', { params })

export const getWorkOrderStats = () =>
  request.get('/work-orders/stats')

export const getResidentWorkOrders = (residentId, params) =>
  request.get(`/work-orders/resident/${residentId}`, { params })

export const getWorkOrderDetail = (id) =>
  request.get(`/work-orders/${id}`)

export const createWorkOrder = (data) =>
  request.post('/work-orders', data)

export const assignWorkOrder = (id, staffId) =>
  request.put(`/work-orders/${id}/assign`, null, { params: { staffId } })

export const startWorkOrder = (id) =>
  request.put(`/work-orders/${id}/start`)

export const completeWorkOrder = (id) =>
  request.put(`/work-orders/${id}/complete`)

export const createVisitRecord = (data) =>
  request.post('/work-orders/visit', data)

export const getVisitRecord = (orderId) =>
  request.get(`/work-orders/${orderId}/visit`)

export const createReview = (data) =>
  request.post('/work-orders/review', data)

export const getReview = (orderId) =>
  request.get(`/work-orders/${orderId}/review`)

export const queryVisitors = (params) =>
  request.get('/visitors/query', { params })

export const createVisitorAppointment = (data) =>
  request.post('/visitors', data)

export const approveVisitor = (id, staffId, approved) =>
  request.put(`/visitors/${id}/approve`, null, { params: { staffId, approved } })

export const visitorCheckIn = (id) =>
  request.put(`/visitors/${id}/check-in`)

export const visitorCheckOut = (id) =>
  request.put(`/visitors/${id}/check-out`)

export const exportVisitors = (params) => {
  const queryStr = new URLSearchParams(params).toString()
  window.open(`/api/visitors/export?${queryStr}`, '_blank')
}

export const queryInspections = (params) =>
  request.get('/inspections/query', { params })

export const createInspectionTask = (data) =>
  request.post('/inspections', data)

export const startInspection = (id) =>
  request.put(`/inspections/${id}/start`)

export const completeInspection = (id, data) =>
  request.put(`/inspections/${id}/complete`, null, { params: data })

export const exportInspections = (params) => {
  const queryStr = new URLSearchParams(params).toString()
  window.open(`/api/inspections/export?${queryStr}`, '_blank')
}

export const queryContractRisks = (params) =>
  request.get('/contract-risks/query', { params })

export const getContractRiskDetail = (id) =>
  request.get(`/contract-risks/${id}`)

export const createContractRisk = (data) =>
  request.post('/contract-risks', data)

export const updateRiskStatus = (id, status, mitigationMeasures) =>
  request.put(`/contract-risks/${id}/status`, null, { params: { status, mitigationMeasures } })

export const queryCallbacks = (params) =>
  request.get('/callbacks/query', { params })

export const getCallbackDetail = (id) =>
  request.get(`/callbacks/${id}`)

export const retryCallback = (id) =>
  request.post(`/callbacks/${id}/retry`)
