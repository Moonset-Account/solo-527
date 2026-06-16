import request from './request'

export function getTimeoutNodes(params) {
  return request.get('/timeliness/timeout-nodes', { params })
}

export function getFulfillmentData(params) {
  return request.get('/timeliness/fulfillment', { params })
}

export function getNodeStats(params) {
  return request.get('/timeliness/node-stats', { params })
}
