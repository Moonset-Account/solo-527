import { apiGet, apiPost, apiPut, apiPatch, apiDelete, apiDownload } from '../utils/request.js';

export const authApi = {
  login: (d) => apiPost('/auth/login', d),
  logout: () => apiPost('/auth/logout'),
  me: () => apiGet('/auth/me'),
  changePassword: (d) => apiPost('/auth/change-password', d),
};

export const userApi = {
  list: (p) => apiGet('/users', p),
  create: (d) => apiPost('/users', d),
  detail: (id) => apiGet(`/users/${id}`),
  update: (id, d) => apiPut(`/users/${id}`, d),
  setStatus: (id, status) => apiPatch(`/users/${id}/status`, status),
};

export const supplierApi = {
  list: (p) => apiGet('/suppliers', p),
  create: (d) => apiPost('/suppliers', d),
  detail: (id) => apiGet(`/suppliers/${id}`),
  update: (id, d) => apiPut(`/suppliers/${id}`, d),
  remove: (id) => apiDelete(`/suppliers/${id}`),
  ratings: (id, p) => apiGet(`/suppliers/${id}/ratings`, p),
  rate: (id, d) => apiPost(`/suppliers/${id}/rate`, d),
  products: (id, p) => apiGet(`/suppliers/${id}/products`, p),
  statistics: (id) => apiGet(`/suppliers/${id}/statistics`),
};

export const categoryApi = {
  list: (p) => apiGet('/categories', p),
  tree: () => apiGet('/categories/tree'),
  create: (d) => apiPost('/categories', d),
  update: (id, d) => apiPut(`/categories/${id}`, d),
  remove: (id) => apiDelete(`/categories/${id}`),
};

export const productApi = {
  list: (p) => apiGet('/products', p),
  create: (d) => apiPost('/products', d),
  detail: (id) => apiGet(`/products/${id}`),
  update: (id, d) => apiPut(`/products/${id}`, d),
  remove: (id) => apiDelete(`/products/${id}`),
  byBarcode: (code) => apiGet(`/products/by-barcode/${encodeURIComponent(code)}`),
  lowStock: (p) => apiGet('/products/low-stock', p),
  withSuppliers: (p) => apiGet('/products/with-suppliers', p),
};

export const inventoryApi = {
  list: (p) => apiGet('/inventory', p),
  adjust: (id, d) => apiPut(`/inventory/${id}/adjust`, d),
  batchAdjust: (d) => apiPost('/inventory/batch-adjust', d),
  alerts: () => apiGet('/inventory/alerts'),
};

export const batchApi = {
  list: (p) => apiGet('/batches', p),
  create: (d) => apiPost('/batches', d),
  detail: (id) => apiGet(`/batches/${id}`),
  update: (id, d) => apiPut(`/batches/${id}`, d),
  remove: (id) => apiDelete(`/batches/${id}`),
  nearExpiry: (p) => apiGet('/batches/near-expiry', p),
  expired: (p) => apiGet('/batches/expired', p),
  adjustStatus: (id, d) => apiPatch(`/batches/${id}/adjust-status`, d),
};

export const purchaseApi = {
  list: (p) => apiGet('/purchase-orders', p),
  create: (d) => apiPost('/purchase-orders', d),
  detail: (id) => apiGet(`/purchase-orders/${id}`),
  update: (id, d) => apiPut(`/purchase-orders/${id}`, d),
  remove: (id) => apiDelete(`/purchase-orders/${id}`),
  setStatus: (id, d) => apiPatch(`/purchase-orders/${id}/status`, d),
  submit: (id) => apiPost(`/purchase-orders/${id}/submit`),
  confirm: (id, d) => apiPost(`/purchase-orders/${id}/confirm`, d || {}),
  cancel: (id, d) => apiPost(`/purchase-orders/${id}/cancel`, d || {}),
};

export const inboundApi = {
  list: (p) => apiGet('/inbound-orders', p),
  create: (d) => apiPost('/inbound-orders', d),
  detail: (id) => apiGet(`/inbound-orders/${id}`),
  update: (id, d) => apiPut(`/inbound-orders/${id}`, d),
  setStatus: (id, d) => apiPatch(`/inbound-orders/${id}/status`, d),
  scanItem: (id, d) => apiPost(`/inbound-orders/${id}/scan-item`, d),
  qc: (id, d) => apiPost(`/inbound-orders/${id}/qc`, d),
  complete: (id) => apiPost(`/inbound-orders/${id}/complete`),
};

export const outboundApi = {
  list: (p) => apiGet('/outbound-orders', p),
  create: (d) => apiPost('/outbound-orders', d),
  detail: (id) => apiGet(`/outbound-orders/${id}`),
  update: (id, d) => apiPut(`/outbound-orders/${id}`, d),
  setStatus: (id, d) => apiPatch(`/outbound-orders/${id}/status`, d),
  scanItem: (id, d) => apiPost(`/outbound-orders/${id}/scan-item`, d),
  complete: (id) => apiPost(`/outbound-orders/${id}/complete`),
};

export const exceptionApi = {
  list: (p) => apiGet('/exceptions', p),
  create: (d) => apiPost('/exceptions', d),
  detail: (id) => apiGet(`/exceptions/${id}`),
  update: (id, d) => apiPut(`/exceptions/${id}`, d),
  setStatus: (id, d) => apiPatch(`/exceptions/${id}/status`, d),
  assign: (id, d) => apiPost(`/exceptions/${id}/assign`, d),
  statistics: (p) => apiGet('/exceptions/statistics', p),
};

export const replyApi = {
  list: {
    byPurchase: (id, p) => apiGet('/replies', { purchaseOrderId: id, ...p }),
    byInbound: (id, p) => apiGet('/replies', { inboundOrderId: id, ...p }),
    byException: (id, p) => apiGet('/replies', { exceptionId: id, ...p }),
  },
  create: (d) => apiPost('/replies', d),
};

export const alertApi = {
  unreadCount: () => apiGet('/alerts/unread-count'),
  list: (p) => apiGet('/alerts', p),
  read: (id) => apiPatch(`/alerts/${id}/read`),
  readAll: () => apiPatch('/alerts/read-all'),
  remove: (id) => apiDelete(`/alerts/${id}`),
};

export const batchOpApi = {
  list: (p) => apiGet('/batch-ops', p),
  preview: (d) => apiPost('/batch-ops/preview', d),
  confirm: (id) => apiPost(`/batch-ops/${id}/confirm`),
  detail: (id) => apiGet(`/batch-ops/${id}`),
  create: (d) => apiPost('/batch-ops', d),
};

export const statsApi = {
  overview: () => apiGet('/statistics/overview'),
  supplierPerformance: (p) => apiGet('/statistics/supplier-performance', p),
  expiryAnalysis: (p) => apiGet('/statistics/expiry-analysis', p),
  exceptionEfficiency: (p) => apiGet('/statistics/exception-efficiency', p),
  dailyTrend: (p) => apiGet('/statistics/daily-trend', p),
};

export const restockApi = {
  list: (p) => apiGet('/restock', p),
  generate: (d) => apiPost('/restock/generate', d || {}),
  action: (id, d) => apiPost(`/restock/${id}/action`, d),
};

export const exportApi = {
  inventory: (d, name) => apiDownload('/export/inventory', d, 'post', name),
  batches: (d, name) => apiDownload('/export/batches', d, 'post', name),
  purchase: (d, name) => apiDownload('/export/purchase', d, 'post', name),
  inbound: (d, name) => apiDownload('/export/inbound', d, 'post', name),
  exception: (d, name) => apiDownload('/export/exception', d, 'post', name),
};
