import request from './index'

export function createDefinition(data) {
  return request.post('/processes/definitions', data)
}

export function listDefinitions() {
  return request.get('/processes/definitions')
}

export function updateDefinition(id, data) {
  return request.put(`/processes/definitions/${id}`, data)
}

export function deleteDefinition(id) {
  return request.delete(`/processes/definitions/${id}`)
}

export function addNode(definitionId, data) {
  return request.post(`/processes/definitions/${definitionId}/nodes`, data)
}

export function updateNode(nodeId, data) {
  return request.put(`/processes/nodes/${nodeId}`, data)
}

export function deleteNode(nodeId) {
  return request.delete(`/processes/nodes/${nodeId}`)
}

export function startProcess(data) {
  return request.post('/processes/instances', data)
}

export function advanceNode(instanceId, data) {
  return request.post(`/processes/instances/${instanceId}/advance`, data)
}

export function getNodes(definitionId) {
  return request.get(`/processes/definitions/${definitionId}/nodes`)
}

export function getUsers() {
  return request.get('/users')
}
