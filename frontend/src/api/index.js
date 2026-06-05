import axios from 'axios'

const client = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
})

client.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const message = err.response?.data?.detail || err.message || '请求失败'
    return Promise.reject(new Error(message))
  }
)

export const getTodayRoutes = () => client.get('/routes/today')

export const getTodayDashboard = () => client.get('/routes/today/dashboard')

export const getRouteOverview = (routeId) => client.get(`/routes/overview/${routeId}`)

export const createRoute = (data) => client.post('/routes/', data)

export const assignCourier = (routeId, data) => client.put(`/routes/${routeId}/assign-courier`, data)

export const listCouriers = () => client.get('/routes/couriers')

export const getElderDetail = (elderId) => client.get(`/elders/${elderId}`)

export const listElders = (params) => client.get('/elders/', { params })

export const updateElder = (elderId, data) => client.put(`/elders/${elderId}`, data)

export const tempSuspendElder = (elderId, data) => client.put(`/elders/${elderId}/temp-suspend`, data)

export const getFamilyContacts = (elderId) => client.get(`/elders/${elderId}/family-contacts`)

export const familyConfirm = (elderId, data) => client.post(`/elders/${elderId}/family-confirm`, data)

export const signDelivery = (deliveryId, formData) => {
  return axios.post(`/api/deliveries/${deliveryId}/sign`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000,
  }).then(res => res.data)
}

export const failDelivery = (deliveryId, data) => client.post(`/deliveries/${deliveryId}/fail`, data)

export const getRouteDeliveries = (routeId) => client.get(`/deliveries/route/${routeId}`)

export const getCourierDeliveries = (courierId, routeId) => client.get(`/deliveries/courier/${courierId}/route/${routeId}`)

export const updateExceptionNote = (deliveryId, data) => client.put(`/deliveries/${deliveryId}/exception-note`, data)

export const redispatchDelivery = (deliveryId, params) => client.post(`/deliveries/${deliveryId}/redispatch`, null, { params })

export const getRedispatchCandidates = (routeId) => client.get(`/deliveries/route/${routeId}/redispatch-candidates`)

export const checkSubsidy = (elderId, orderAmount) => client.get('/subsidies/check', { params: { elder_id: elderId, order_amount: orderAmount } })

export const deductSubsidy = (elderId, orderId, amount, force = false) => client.post('/subsidies/deduct', null, { params: { elder_id: elderId, order_id: orderId, amount, force } })

export const getSubsidyRecords = (elderId) => client.get(`/subsidies/records/${elderId}`)

export const getPendingConfirmations = () => client.get('/subsidies/confirmations/pending')

export const approveConfirmation = (confirmationId, confirmerName, note) => client.post(`/subsidies/confirmations/${confirmationId}/approve`, null, { params: { confirmer_name: confirmerName, note } })

export const getReconciliation = (params) => client.get('/subsidies/reconciliation', { params })

export const getColdBoxes = (params) => client.get('/cold-boxes/', { params })

export const updateColdBoxTemp = (boxId, data) => client.put(`/cold-boxes/${boxId}/temperature`, data)

export const getAbnormalColdBoxes = (params) => client.get('/cold-boxes/abnormal', { params })

export const getColdBoxAlerts = (boxId) => client.get(`/cold-boxes/${boxId}/alerts`)

export const resolveColdBoxAlert = (alertId) => client.put(`/cold-boxes/alerts/${alertId}/resolve`)

export const getReviewTasks = (params) => client.get('/cold-boxes/review-tasks', { params })

export const completeReviewTask = (taskId, data) => client.put(`/cold-boxes/review-tasks/${taskId}/complete`, data)

export const getNotifications = (params) => client.get('/notifications/', { params })

export const createNotification = (data) => client.post('/notifications/', data)

export const sendNotification = (notificationId) => client.post(`/notifications/${notificationId}/send`)

export const retryPendingNotifications = () => client.post('/notifications/retry-pending')

export default client
