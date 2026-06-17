import request from '@/utils/request'

export const traceApi = {
  traceBySourceOrderNo(sourceOrderNo) {
    return request.get(`/trace/source-order/${sourceOrderNo}`)
  },
  getPromptVersionsBySourceOrderNo(sourceOrderNo) {
    return request.get('/trace/prompt-versions', { params: { sourceOrderNo } })
  }
}

export const draftApi = {
  createDraft(data) {
    return request.post('/email-draft', data)
  },
  saveDraft(id, data) {
    return request.put(`/email-draft/${id}`, data)
  },
  generateByAI(id, data) {
    return request.post(`/email-draft/${id}/ai-generate`, data)
  },
  queryDrafts(data) {
    return request.post('/email-draft/query', data)
  },
  getDraftById(id) {
    return request.get(`/email-draft/${id}`)
  },
  getDraftVersions(id) {
    return request.get(`/email-draft/${id}/versions`)
  },
  getDraftVersion(id, version) {
    return request.get(`/email-draft/${id}/versions/${version}`)
  },
  revertToVersion(id, version, data) {
    return request.post(`/email-draft/${id}/revert/${version}`, data)
  },
  updateStatus(id, data) {
    return request.put(`/email-draft/${id}/status`, data)
  },
  submitForReview(id, data) {
    return request.post(`/email-draft/${id}/submit-review`, data)
  }
}

export const reviewApi = {
  aiReview(draftId, version) {
    return request.post(`/email-review/ai-review/${draftId}/${version}`)
  },
  manualReview(data) {
    return request.post('/email-review/manual-review', data)
  },
  queryReviews(params) {
    return request.get('/email-review/query', { params })
  },
  getPendingReviews(supervisorId) {
    return request.get(`/email-review/pending/${supervisorId || 0}`)
  },
  getPendingCount(supervisorId) {
    return request.get(`/email-review/pending-count/${supervisorId || 0}`)
  }
}

export const forbiddenWordApi = {
  getAllEnabledWords() {
    return request.get('/forbidden-word/all-enabled')
  },
  checkContent(data) {
    return request.post('/forbidden-word/check', data)
  },
  queryWords(params) {
    return request.get('/forbidden-word/query', { params })
  },
  addWord(data) {
    return request.post('/forbidden-word', data)
  },
  updateWord(data) {
    return request.put('/forbidden-word', data)
  },
  deleteWord(id, params) {
    return request.delete(`/forbidden-word/${id}`, { params })
  },
  queryWordHits(params) {
    return request.get('/forbidden-word/hits/query', { params })
  }
}

export const promptApi = {
  getAllTemplates() {
    return request.get('/prompt/templates')
  },
  getTemplateVersions(templateId) {
    return request.get(`/prompt/template/${templateId}/versions`)
  },
  getActiveVersion(templateId) {
    return request.get(`/prompt/template/${templateId}/active-version`)
  },
  getVersionById(versionId) {
    return request.get(`/prompt/version/${versionId}`)
  },
  addTemplate(data, params) {
    return request.post('/prompt/template', data, { params })
  },
  addVersion(data) {
    return request.post('/prompt/version', data)
  },
  updateVersionStatus(versionId, data) {
    return request.put(`/prompt/version/${versionId}/status`, data)
  }
}

export const adoptionApi = {
  queryStatistics(data) {
    return request.post('/adoption-stat/query', data)
  },
  getSummary(data) {
    return request.post('/adoption-stat/summary', data)
  }
}

export const userApi = {
  getAllUsers() {
    return request.get('/user/all')
  },
  getUsersByRole(role) {
    return request.get(`/user/role/${role}`)
  },
  getUserById(id) {
    return request.get(`/user/${id}`)
  }
}
