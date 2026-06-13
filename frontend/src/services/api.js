import request from '../utils/request'

export const login = (data) => request.post('/auth/login', data)
export const getCurrentUser = () => request.get('/auth/me')

export const getPurchaseRequests = (params) => request.get('/purchase-requests', { params })
export const getPurchaseRequestDetail = (id) => request.get(`/purchase-requests/${id}`)
export const createPurchaseRequest = (data) => request.post('/purchase-requests', data)
export const updatePurchaseRequest = (id, data) => request.put(`/purchase-requests/${id}`, data)
export const submitPurchaseRequest = (id) => request.post(`/purchase-requests/${id}/submit`)
export const deletePurchaseRequest = (id) => request.delete(`/purchase-requests/${id}`)
export const uploadAttachment = (formData) => request.post('/purchase-requests/attachments', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
})
export const deleteAttachment = (id) => request.delete(`/purchase-requests/attachments/${id}`)

export const getApprovalLevels = () => request.get('/approvals/levels')
export const createApprovalLevel = (data) => request.post('/approvals/levels', data)
export const updateApprovalLevel = (id, data) => request.put(`/approvals/levels/${id}`, data)
export const deleteApprovalLevel = (id) => request.delete(`/approvals/levels/${id}`)
export const getMyApprovals = (params) => request.get('/approvals/my', { params })
export const approveRequest = (id, data) => request.post(`/approvals/${id}/approve`, data)
export const rejectRequest = (id, data) => request.post(`/approvals/${id}/reject`, data)

export const getPriceHistory = (params) => request.get('/price/history', { params })
export const addPriceHistory = (data) => request.post('/price/history', data)
export const getPriceAlerts = (params) => request.get('/price/alerts', { params })
export const reviewPriceAlert = (id, data) => request.post(`/price/alerts/${id}/review`, data)
export const getPriceReviews = (params) => request.get('/price/reviews', { params })

export const getPriceTrend = (params) => request.get('/tracking/price-trend', { params })
export const getDeliveryConfirmations = (params) => request.get('/tracking/delivery-confirmations', { params })
export const confirmDelivery = (data) => request.post('/tracking/delivery-confirmations', data)
export const getOriginalDocuments = (params) => request.get('/tracking/original-documents', { params })
export const getTrackingPurchaseRequests = (params) => request.get('/tracking/purchase-requests', { params })

export const getPaymentAlerts = (params) => request.get('/payment/alerts', { params })
export const createPaymentAlert = (data) => request.post('/payment/alerts', data)
export const resolvePaymentAlert = (id, data) => request.post(`/payment/alerts/${id}/resolve`, data)
export const getSupplierRiskBoard = (params) => request.get('/payment/risk-board', { params })
export const getSupplierRiskDetail = (id) => request.get(`/payment/risk-board/${id}`)

export const getBatchLogs = (params) => request.get('/batch/logs', { params })
export const getBatchDetail = (id, params) => request.get(`/batch/logs/${id}`, { params })
export const previewBatchUpdate = (data) => request.post('/batch/preview', data)
export const batchUpdate = (data) => request.post('/batch/update', data)

export const getSuppliers = (params) => request.get('/suppliers', { params })
export const getSupplierDetail = (id) => request.get(`/suppliers/${id}`)
export const createSupplier = (data) => request.post('/suppliers', data)
export const updateSupplier = (id, data) => request.put(`/suppliers/${id}`, data)
export const deleteSupplier = (id) => request.delete(`/suppliers/${id}`)
