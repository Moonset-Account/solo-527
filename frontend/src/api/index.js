import request from '../utils/request'

export const authApi = {
  login: (data) => request.post('/auth/login', data),
  register: (data) => request.post('/auth/register', data),
  getUsers: () => request.get('/auth/users'),
  getUserById: (id) => request.get(`/auth/users/${id}`),
}

export const requirementApi = {
  create: (data) => request.post('/requirements', data),
  update: (id, data) => request.put(`/requirements/${id}`, data),
  getById: (id) => request.get(`/requirements/${id}`),
  search: (params, page = 0, size = 20) => request.post('/requirements/search', params, {
    params: { page, size }
  }),
  submit: (id, workflowId) => request.post(`/requirements/${id}/submit`, null, {
    params: { workflowId }
  }),
  assign: (id, assigneeId) => request.post(`/requirements/${id}/assign`, null, {
    params: { assigneeId }
  }),
  merge: (sourceId, targetId) => request.post('/requirements/merge', null, {
    params: { sourceId, targetId }
  }),
  getDuplicates: (id) => request.get(`/requirements/${id}/duplicates`),
  close: (id, remark) => request.post(`/requirements/${id}/close`, null, {
    params: { remark }
  }),
  getNodes: (id) => request.get(`/requirements/${id}/nodes`),
  approveNode: (nodeId, comment) => request.post(`/requirements/nodes/${nodeId}/approve`, null, {
    params: { comment }
  }),
  rejectNode: (nodeId, comment) => request.post(`/requirements/nodes/${nodeId}/reject`, null, {
    params: { comment }
  }),
  markNodeStuck: (nodeId, reason) => request.post(`/requirements/nodes/${nodeId}/stuck`, null, {
    params: { reason }
  }),
  getBatch: (ids) => request.post('/requirements/batch', ids),
}

export const departmentApi = {
  getAll: () => request.get('/departments'),
  getById: (id) => request.get(`/departments/${id}`),
  create: (data) => request.post('/departments', data),
  update: (id, data) => request.put(`/departments/${id}`, data),
  delete: (id) => request.delete(`/departments/${id}`),
}

export const delayApi = {
  create: (params) => request.post('/delays', null, { params }),
  getByRequirement: (requirementId) => request.get(`/delays/requirement/${requirementId}`),
  search: (params, page = 0, size = 20) => request.post('/delays/search', params, {
    params: { page, size }
  }),
  getBatch: (deptIds) => request.post('/delays/batch', deptIds),
  getStats: (deptIds) => request.post('/delays/stats', deptIds),
}

export const statisticsApi = {
  getOverview: () => request.get('/statistics/overview'),
  getDeptStats: (deptId) => request.get(`/statistics/dept/${deptId}`),
  getDeptStatsBatch: (deptIds) => request.post('/statistics/dept/batch', deptIds),
  getUserStats: (userId) => request.get(`/statistics/user/${userId}`),
}

export const exportApi = {
  exportRequirements: (params, checkDuplicate = true) => {
    return request.post('/export/requirements', params, {
      params: { checkDuplicate },
      responseType: 'blob',
    })
  },
  exportRequirementsByIds: (ids) => {
    return request.post('/export/requirements/batch', ids, {
      responseType: 'blob',
    })
  },
  checkDuplicate: (params) => request.post('/export/check-duplicate', params),
}

export const operationLogApi = {
  getAll: (page = 0, size = 20) => request.get('/operation-logs', {
    params: { page, size }
  }),
  getByRequirement: (requirementId, page = 0, size = 20) =>
    request.get(`/operation-logs/requirement/${requirementId}`, {
      params: { page, size }
    }),
  getByType: (operationType, page = 0, size = 20) =>
    request.get(`/operation-logs/type/${operationType}`, {
      params: { page, size }
    }),
  getByOperator: (operatorId, page = 0, size = 20) =>
    request.get(`/operation-logs/operator/${operatorId}`, {
      params: { page, size }
    }),
}
