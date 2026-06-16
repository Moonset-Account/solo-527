import request from './request'

export function getStations() {
  return request.get('/stations')
}

export function getStationInventory(stationId) {
  return request.get(`/stations/${stationId}/inventory`)
}
