import request from './index'

export function createDefinition(data) {
  return request.post('/process/definitions', data)
}

export function listDefinitions() {
  return request.get('/process/definitions')
}

export function updateDefinition(id, data) {
  return request.put(`/process/definitions/${id}`, data)
}

export function deleteDefinition(id) {
  return request.delete(`/process/definitions/${id}`)
}

export function addNode(definitionId, data) {
  return request.post(`/process/definitions/${definitionId}/nodes`, data)
}

export function updateNode(definitionId, nodeId, data) {
  return request.put(`/process/definitions/${definitionId}/nodes/${nodeId}`, data)
}

export function deleteNode(definitionId, nodeId) {
  return request.delete(`/process/definitions/${definitionId}/nodes/${nodeId}`)
}

export function startProcess(requirementId) {
  return request.post('/process/instances', { requirementId })
}

export function advanceNode(instanceId, data) {
  return request.put(`/process/instances/${instanceId}/advance`, data)
}

export function getNodes(definitionId) {
  return request.get(`/process/definitions/${definitionId}/nodes`)
}

export function getUsers() {
  return request.get('/users')
}
