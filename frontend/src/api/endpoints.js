import api from './index'

export const authApi = {
  login: (data) => api.post('/token/', data),
  getCurrentUser: () => api.get('/users/me/'),
  changePassword: (data) => api.post('/users/change_password/', data),
  getRoles: () => api.get('/users/roles/')
}

export const userApi = {
  list: (params) => api.get('/users/', { params }),
  create: (data) => api.post('/users/', data),
  update: (id, data) => api.patch(`/users/${id}/`, data),
  delete: (id) => api.delete(`/users/${id}/`)
}

export const savedFilterApi = {
  list: (params) => api.get('/users/saved-filters/', { params }),
  create: (data) => api.post('/users/saved-filters/', data),
  update: (id, data) => api.patch(`/users/saved-filters/${id}/`, data),
  delete: (id) => api.delete(`/users/saved-filters/${id}/`)
}

export const consumableApi = {
  categories: {
    list: (params) => api.get('/consumables/categories/', { params }),
    all: () => api.get('/consumables/categories/all_categories/'),
    create: (data) => api.post('/consumables/categories/', data),
    update: (id, data) => api.patch(`/consumables/categories/${id}/`, data),
    delete: (id) => api.delete(`/consumables/categories/${id}/`)
  },
  specifications: {
    list: (params) => api.get('/consumables/specifications/', { params }),
    detail: (id) => api.get(`/consumables/specifications/${id}/`),
    create: (data) => api.post('/consumables/specifications/', data),
    update: (id, data) => api.patch(`/consumables/specifications/${id}/`, data),
    delete: (id) => api.delete(`/consumables/specifications/${id}/`),
    batchQuery: (ids) => api.post('/consumables/specifications/batch_query/', { ids }),
    batchQueryWithAttachments: (data) => api.post('/consumables/specifications/batch_query_with_attachments/', data)
  },
  attachments: {
    list: (params) => api.get('/consumables/attachments/', { params }),
    create: (formData) => api.post('/consumables/attachments/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    delete: (id) => api.delete(`/consumables/attachments/${id}/`)
  },
  monthlyUsages: {
    list: (params) => api.get('/consumables/monthly-usages/', { params }),
    create: (data) => api.post('/consumables/monthly-usages/', data),
    update: (id, data) => api.patch(`/consumables/monthly-usages/${id}/`, data),
    batchCreate: (data) => api.post('/consumables/monthly-usages/batch_create/', data),
    summary: (params) => api.get('/consumables/monthly-usages/summary/', { params })
  }
}

export const supplierApi = {
  list: (params) => api.get('/suppliers/', { params }),
  detail: (id) => api.get(`/suppliers/${id}/`),
  create: (data) => api.post('/suppliers/', data),
  update: (id, data) => api.patch(`/suppliers/${id}/`, data),
  delete: (id) => api.delete(`/suppliers/${id}/`),
  riskSummary: () => api.get('/suppliers/risk_summary/'),
  risks: {
    list: (params) => api.get('/suppliers/risks/', { params }),
    detail: (id) => api.get(`/suppliers/risks/${id}/`),
    create: (data) => api.post('/suppliers/risks/', data),
    update: (id, data) => api.patch(`/suppliers/risks/${id}/`, data),
    handle: (id, data) => api.post(`/suppliers/risks/${id}/handle/`, data)
  },
  riskEvidences: {
    list: (params) => api.get('/suppliers/risk-evidences/', { params }),
    create: (formData) => api.post('/suppliers/risk-evidences/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  evaluations: {
    list: (params) => api.get('/suppliers/evaluations/', { params }),
    create: (data) => api.post('/suppliers/evaluations/', data)
  }
}

export const contractApi = {
  list: (params) => api.get('/contracts/', { params }),
  detail: (id) => api.get(`/contracts/${id}/`),
  create: (data) => api.post('/contracts/', data),
  update: (id, data) => api.patch(`/contracts/${id}/`, data),
  delete: (id) => api.delete(`/contracts/${id}/`),
  expiringSoon: (params) => api.get('/contracts/expiring_soon/', { params }),
  statusSummary: () => api.get('/contracts/status_summary/'),
  submitForApproval: (id) => api.post(`/contracts/${id}/submit_for_approval/`),
  createRenewal: (id, data) => api.post(`/contracts/${id}/create_renewal/`, data),
  prices: {
    list: (params) => api.get('/contracts/prices/', { params }),
    create: (data) => api.post('/contracts/prices/', data),
    update: (id, data) => api.patch(`/contracts/prices/${id}/`, data)
  },
  priceHistories: {
    list: (params) => api.get('/contracts/price-histories/', { params }),
    fluctuation: (params) => api.get('/contracts/price-histories/fluctuation/', { params })
  },
  renewals: {
    list: (params) => api.get('/contracts/renewals/', { params }),
    handle: (id, data) => api.post(`/contracts/renewals/${id}/handle/`, data)
  }
}

export const invoiceApi = {
  list: (params) => api.get('/invoices/', { params }),
  detail: (id) => api.get(`/invoices/${id}/`),
  create: (data) => api.post('/invoices/', data),
  update: (id, data) => api.patch(`/invoices/${id}/`, data),
  statusSummary: () => api.get('/invoices/status_summary/'),
  overdue: () => api.get('/invoices/overdue/'),
  submit: (id) => api.post(`/invoices/${id}/submit/`),
  review: (id, data) => api.post(`/invoices/${id}/review/`, data),
  pay: (id, data) => api.post(`/invoices/${id}/pay/`, data)
}

export const approvalApi = {
  requests: {
    list: (params) => api.get('/approvals/requests/', { params }),
    myPending: () => api.get('/approvals/requests/my_pending/'),
    mySubmitted: () => api.get('/approvals/requests/my_submitted/'),
    create: (data) => api.post('/approvals/requests/', data),
    approve: (id, data) => api.post(`/approvals/requests/${id}/approve/`, data),
    reject: (id, data) => api.post(`/approvals/requests/${id}/reject/`, data)
  },
  flows: {
    list: (params) => api.get('/approvals/flows/', { params })
  },
  levels: {
    list: (params) => api.get('/approvals/levels/', { params })
  }
}

export const dashboardApi = {
  stats: () => api.get('/dashboard/stats/'),
  priceFluctuation: (params) => api.get('/dashboard/price-fluctuation/', { params }),
  notifications: {
    list: (params) => api.get('/dashboard/notifications/', { params }),
    unreadCount: () => api.get('/dashboard/notifications/unread_count/'),
    markAllRead: () => api.post('/dashboard/notifications/mark_all_read/'),
    markRead: (id) => api.post(`/dashboard/notifications/${id}/mark_read/`),
    handle: (id, data) => api.post(`/dashboard/notifications/${id}/handle/`, data)
  },
  widgets: {
    list: () => api.get('/dashboard/widgets/'),
    create: (data) => api.post('/dashboard/widgets/', data),
    update: (id, data) => api.patch(`/dashboard/widgets/${id}/`, data),
    reorder: (ids) => api.post('/dashboard/widgets/reorder/', { widget_ids: ids })
  }
}
