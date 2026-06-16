import request from './request'

export function getTimeoutNodes(params) {
  return request.get('/timeliness/timeout-nodes', { params })
}

export function getFulfillmentData(params) {
  return request.get('/timeliness/fulfillment', { params })
}

export function getFulfillmentByStation(params) {
  return request.get('/timeliness/fulfillment-by-station', { params })
}

export function getNodeStats() {
  return request.get('/timeliness/stats')
}
