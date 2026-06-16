import request from './request'

export function getStations(params) {
  return request.get('/stations', { params })
}

export function getStationInventory(stationId, params) {
  return request.get(`/stations/${stationId}/inventory`, { params })
}
