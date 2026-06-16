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

export function getFullAnalysis() {
  return request.get('/timeliness/analysis')
}

export function getTimeoutReasons() {
  return request.get('/timeliness/timeout-reasons')
}

export function getTimeoutOrders() {
  return request.get('/timeliness/timeout-orders')
}
