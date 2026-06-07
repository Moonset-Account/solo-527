import { FAULT_CODES } from '../mock/seed.js'

export function cleanFaultLogs(faultLogs) {
  return faultLogs.map(fault => {
    const cleaned = { ...fault }
    
    if (!cleaned.fault_desc || cleaned.fault_desc.trim() === '') {
      const meta = FAULT_CODES.find(f => f.code === cleaned.fault_code)
      cleaned.fault_desc = meta ? meta.desc : '未知故障'
    }
    
    if (!cleaned.severity) {
      const meta = FAULT_CODES.find(f => f.code === cleaned.fault_code)
      cleaned.severity = meta ? meta.severity : 'medium'
    }
    
    if (!cleaned.occur_time) {
      cleaned.occur_time = new Date().toISOString()
    }
    
    cleaned.is_resolved = cleaned.resolve_time != null && cleaned.resolve_time !== ''
    
    return cleaned
  })
}

export function cleanPowerReadings(readings) {
  if (readings.length < 2) return readings
  
  const cleaned = [...readings].sort((a, b) => 
    new Date(a.timestamp) - new Date(b.timestamp)
  )
  
  for (let i = 1; i < cleaned.length - 1; i++) {
    if (cleaned[i].power == null || isNaN(cleaned[i].power)) {
      const prev = cleaned[i - 1].power || 0
      const next = cleaned[i + 1].power || 0
      cleaned[i].power = parseFloat(((prev + next) / 2).toFixed(2))
      cleaned[i]._interpolated = true
    }
  }
  
  let gapStart = -1
  const gapThreshold = 5 * 60 * 1000
  
  for (let i = 1; i < cleaned.length; i++) {
    const t1 = new Date(cleaned[i - 1].timestamp).getTime()
    const t2 = new Date(cleaned[i].timestamp).getTime()
    
    if (t2 - t1 > gapThreshold) {
      if (gapStart === -1) gapStart = i - 1
      for (let j = gapStart + 1; j <= i; j++) {
        cleaned[j]._gap = true
      }
    } else {
      gapStart = -1
    }
  }
  
  return cleaned
}

export function cleanRepairOrders(orders) {
  return orders.map(order => {
    const cleaned = { ...order }
    
    if (cleaned.status === 'completed' && !cleaned.complete_time) {
      cleaned.status = 'in_progress'
    }
    
    if (cleaned.complete_time && cleaned.create_time) {
      const ms = new Date(cleaned.complete_time) - new Date(cleaned.create_time)
      cleaned.repair_hours = parseFloat((ms / 3600000).toFixed(1))
    }
    
    return cleaned
  })
}

export function cleanStations(stations) {
  const regionCenters = {
    '朝阳区': { lat: 39.9219, lng: 116.4431 },
    '海淀区': { lat: 39.9590, lng: 116.2980 },
    '丰台区': { lat: 39.8571, lng: 116.2869 },
    '东城区': { lat: 39.9285, lng: 116.4165 },
    '西城区': { lat: 39.9128, lng: 116.3634 },
    '通州区': { lat: 39.9087, lng: 116.6569 },
    '昌平区': { lat: 40.2208, lng: 116.2313 },
    '大兴区': { lat: 39.7289, lng: 116.3398 }
  }
  
  return stations.map(station => {
    const cleaned = { ...station }
    
    if (!cleaned.lat || !cleaned.lng || isNaN(cleaned.lat) || isNaN(cleaned.lng)) {
      const center = regionCenters[cleaned.region] || { lat: 39.9042, lng: 116.4074 }
      cleaned.lat = center.lat + (Math.random() - 0.5) * 0.02
      cleaned.lng = center.lng + (Math.random() - 0.5) * 0.02
      cleaned._coordFallback = true
    }
    
    return cleaned
  })
}

export function cleanAllData(rawData) {
  return {
    ...rawData,
    stations: cleanStations(rawData.stations),
    chargers: rawData.chargers,
    sessions: rawData.sessions,
    powerReadings: cleanPowerReadings(rawData.powerReadings),
    faultLogs: cleanFaultLogs(rawData.faultLogs),
    repairOrders: cleanRepairOrders(rawData.repairOrders),
    repairPersons: rawData.repairPersons
  }
}
