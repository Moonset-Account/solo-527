import request from '@/utils/request'

export const detectionItemAPI = {
  getById: (id) => request({ url: `/api/detection-items/${id}`, method: 'get' }),
  getByCode: (code) => request({ url: `/api/detection-items/code/${code}`, method: 'get' }),
  getByCategory: (category) => request({ url: `/api/detection-items/category/${category}`, method: 'get' }),
  getEnabled: () => request({ url: '/api/detection-items/enabled', method: 'get' }),
  getPage: (params) => request({ url: '/api/detection-items/page', method: 'get', params }),
  create: (data) => request({ url: '/api/detection-items', method: 'post', data }),
  update: (data) => request({ url: '/api/detection-items', method: 'put', data }),
  delete: (id) => request({ url: `/api/detection-items/${id}`, method: 'delete' }),
  toggleStatus: (id) => request({ url: `/api/detection-items/${id}/toggle-status`, method: 'put' })
}

export const detectionRecordAPI = {
  getById: (id) => request({ url: `/api/detection-records/${id}`, method: 'get' }),
  getByNo: (recordNo) => request({ url: `/api/detection-records/no/${recordNo}`, method: 'get' }),
  getItems: (id) => request({ url: `/api/detection-records/${id}/items`, method: 'get' }),
  getPage: (params) => request({ url: '/api/detection-records/page', method: 'get', params }),
  create: (data) => request({ url: '/api/detection-records', method: 'post', data }),
  update: (data) => request({ url: '/api/detection-records', method: 'put', data }),
  updateItems: (id, items) => request({ url: `/api/detection-records/${id}/items`, method: 'put', data: items }),
  updateStatus: (id, status) => request({ url: `/api/detection-records/${id}/status`, method: 'put', params: { status } })
}

export const memberPackageAPI = {
  getById: (id) => request({ url: `/api/member-packages/${id}`, method: 'get' }),
  getByCode: (packageCode) => request({ url: `/api/member-packages/code/${packageCode}`, method: 'get' }),
  getEnabled: () => request({ url: '/api/member-packages/enabled', method: 'get' }),
  getBenefits: (id) => request({ url: `/api/member-packages/${id}/benefits`, method: 'get' }),
  getPage: (params) => request({ url: '/api/member-packages/page', method: 'get', params }),
  create: (data) => request({ url: '/api/member-packages', method: 'post', data }),
  update: (data) => request({ url: '/api/member-packages', method: 'put', data }),
  toggleStatus: (id) => request({ url: `/api/member-packages/${id}/toggle-status`, method: 'put' }),
  delete: (id) => request({ url: `/api/member-packages/${id}`, method: 'delete' })
}

export const memberPackageOrderAPI = {
  getById: (id) => request({ url: `/api/member-package-orders/${id}`, method: 'get' }),
  getByNo: (orderNo) => request({ url: `/api/member-package-orders/no/${orderNo}`, method: 'get' }),
  getPage: (params) => request({ url: '/api/member-package-orders/page', method: 'get', params }),
  createOrder: (data) => request({ url: '/api/member-package-orders', method: 'post', data }),
  useOrder: (id) => request({ url: `/api/member-package-orders/${id}/use`, method: 'post' }),
  expireOrder: (id) => request({ url: `/api/member-package-orders/${id}/expire`, method: 'put' })
}

export const repairOrderAPI = {
  getById: (id) => request({ url: `/api/repair-orders/${id}`, method: 'get' }),
  getByNo: (orderNo) => request({ url: `/api/repair-orders/no/${orderNo}`, method: 'get' }),
  getStatusHistory: (id) => request({ url: `/api/repair-orders/${id}/status-history`, method: 'get' }),
  getItems: (id) => request({ url: `/api/repair-orders/${id}/items`, method: 'get' }),
  getPage: (params) => request({ url: '/api/repair-orders/page', method: 'get', params }),
  create: (data) => request({ url: '/api/repair-orders', method: 'post', data }),
  update: (data) => request({ url: '/api/repair-orders', method: 'put', data }),
  updateStatus: (data) => request({ url: '/api/repair-orders/status', method: 'put', data }),
  batchUpdateStatus: (data) => request({ url: '/api/repair-orders/batch-status', method: 'post', data }),
  handleDelay: (data) => request({ url: '/api/repair-orders/handle-delay', method: 'post', data }),
  closeOrder: (data) => request({ url: '/api/repair-orders/close', method: 'post', data })
}

export const batchOperationAPI = {
  getById: (id) => request({ url: `/api/batch-operations/${id}`, method: 'get' }),
  getByNo: (batchNo) => request({ url: `/api/batch-operations/no/${batchNo}`, method: 'get' }),
  getPage: (params) => request({ url: '/api/batch-operations/page', method: 'get', params }),
  create: (data) => request({ url: '/api/batch-operations', method: 'post', data }),
  confirm: (data) => request({ url: '/api/batch-operations/confirm', method: 'post', data })
}

export const traceAPI = {
  trace: (data) => request({ url: '/api/trace', method: 'post', data }),
  tracePackageOrder: (packageOrderId) => request({ url: `/api/trace/package-order/${packageOrderId}`, method: 'get' }),
  traceTechnicianAndWorkstation: (repairOrderId) => request({ url: `/api/trace/technician-workstation/${repairOrderId}`, method: 'get' }),
  traceTestDrive: (testDriveId) => request({ url: `/api/trace/test-drive/${testDriveId}`, method: 'get' }),
  getRepairOrderSources: (repairOrderId) => request({ url: `/api/trace/repair-order-sources/${repairOrderId}`, method: 'get' })
}

export const efficiencyReportAPI = {
  getById: (id) => request({ url: `/api/efficiency-reports/${id}`, method: 'get' }),
  getByNo: (reportNo) => request({ url: `/api/efficiency-reports/no/${reportNo}`, method: 'get' }),
  getDetail: (id) => request({ url: `/api/efficiency-reports/${id}/detail`, method: 'get' }),
  getPage: (params) => request({ url: '/api/efficiency-reports/page', method: 'get', params }),
  generate: (data) => request({ url: '/api/efficiency-reports/generate', method: 'post', data })
}

export const exceptionRecordAPI = {
  getById: (id) => request({ url: `/api/exception-records/${id}`, method: 'get' }),
  getByNo: (exceptionNo) => request({ url: `/api/exception-records/no/${exceptionNo}`, method: 'get' }),
  getByBatchOperationId: (batchOperationId) => request({ url: `/api/exception-records/batch/${batchOperationId}`, method: 'get' }),
  getPage: (params) => request({ url: '/api/exception-records/page', method: 'get', params }),
  handleException: (id, data) => request({ url: `/api/exception-records/${id}/handle`, method: 'post', data }),
  ignoreException: (id, data) => request({ url: `/api/exception-records/${id}/ignore`, method: 'post', data }),
  retryException: (id) => request({ url: `/api/exception-records/${id}/retry`, method: 'post' })
}

export const testDriveRecordAPI = {
  getById: (id) => request({ url: `/api/test-drive-records/${id}`, method: 'get' }),
  getByNo: (driveNo) => request({ url: `/api/test-drive-records/no/${driveNo}`, method: 'get' }),
  getPage: (params) => request({ url: '/api/test-drive-records/page', method: 'get', params }),
  create: (data) => request({ url: '/api/test-drive-records', method: 'post', data }),
  update: (data) => request({ url: '/api/test-drive-records', method: 'put', data }),
  startDrive: (id) => request({ url: `/api/test-drive-records/${id}/start`, method: 'post' }),
  endDrive: (id, data) => request({ url: `/api/test-drive-records/${id}/end`, method: 'post', data }),
  cancelDrive: (id) => request({ url: `/api/test-drive-records/${id}/cancel`, method: 'post' })
}

export const commonAPI = {
  getMemberById: (id) => request({ url: `/api/common/members/${id}`, method: 'get' }),
  getMembersPage: (params) => request({ url: '/api/common/members/page', method: 'get', params }),
  getAllMembers: () => request({ url: '/api/common/members/all', method: 'get' }),
  getTechnicianById: (id) => request({ url: `/api/common/technicians/${id}`, method: 'get' }),
  getTechniciansPage: (params) => request({ url: '/api/common/technicians/page', method: 'get', params }),
  getAllTechnicians: () => request({ url: '/api/common/technicians/all', method: 'get' }),
  getEnabledTechnicians: () => request({ url: '/api/common/technicians/enabled', method: 'get' }),
  getWorkstationById: (id) => request({ url: `/api/common/workstations/${id}`, method: 'get' }),
  getWorkstationsPage: (params) => request({ url: '/api/common/workstations/page', method: 'get', params }),
  getAllWorkstations: () => request({ url: '/api/common/workstations/all', method: 'get' }),
  getEnabledWorkstations: () => request({ url: '/api/common/workstations/enabled', method: 'get' })
}
