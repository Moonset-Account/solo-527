import { mergeDuplicateRepairs } from './merger.js'

export function calcAvailability(chargers, faultLogs, timeRange = null) {
  const onlineChargers = chargers.filter(c => !c.is_offline)
  
  let faultsInRange = faultLogs
  
  if (timeRange && timeRange[0] && timeRange[1]) {
    const start = new Date(timeRange[0]).getTime()
    const end = new Date(timeRange[1]).getTime()
    
    faultsInRange = faultLogs.filter(f => {
      const t = new Date(f.occur_time).getTime()
      return t >= start && t <= end
    })
  }
  
  const mergedFaults = mergeDuplicateRepairs(faultsInRange)
  
  const faultsFromLogs = new Set(
    mergedFaults
      .filter(f => onlineChargers.some(c => c.id === f.charger_id))
      .map(f => f.charger_id)
  )
  
  const faultsFromStatus = new Set(
    onlineChargers.filter(c => c.status === 'fault').map(c => c.id)
  )
  
  const faultyChargerIds = new Set([...faultsFromLogs, ...faultsFromStatus])
  
  const onlineNormal = onlineChargers.filter(c => !faultyChargerIds.has(c.id)).length
  const onlineTotal = onlineChargers.length
  
  return {
    rate: onlineTotal > 0 ? onlineNormal / onlineTotal : 1,
    online_normal: onlineNormal,
    online_faulty: onlineTotal - onlineNormal,
    online_total: onlineTotal,
    offline_count: chargers.filter(c => c.is_offline).length,
    faults_from_logs: faultsFromLogs.size,
    faults_from_status: faultsFromStatus.size
  }
}

export function calcAvgRepairTime(repairOrders) {
  const completed = repairOrders.filter(o => o.status === 'completed' && o.repair_hours != null)
  
  if (completed.length === 0) return { avg: 0, count: 0 }
  
  const sum = completed.reduce((acc, o) => acc + o.repair_hours, 0)
  return {
    avg: parseFloat((sum / completed.length).toFixed(2)),
    count: completed.length
  }
}

export function calcDuplicateRate(faultLogs) {
  const merged = mergeDuplicateRepairs(faultLogs)
  const duplicates = merged.filter(m => m.duplicate_count > 1)
  const totalDuplicates = duplicates.reduce((acc, d) => acc + (d.duplicate_count - 1), 0)
  
  return {
    rate: faultLogs.length > 0 ? totalDuplicates / faultLogs.length : 0,
    duplicate_count: totalDuplicates,
    original_count: faultLogs.length,
    merged_count: merged.length
  }
}

export function calcFaultsByStation(stations, faultLogs, chargers) {
  return stations.map(station => {
    const stationChargers = chargers.filter(c => c.station_id === station.id)
    const stationFaults = faultLogs.filter(f => f.station_id === station.id)
    const mergedFaults = mergeDuplicateRepairs(stationFaults)
    const availability = calcAvailability(stationChargers, stationFaults)
    
    return {
      ...station,
      fault_count: mergedFaults.length,
      charger_count: stationChargers.length,
      availability: availability.rate,
      online_chargers: availability.online_total,
      offline_chargers: availability.offline_count,
      unresolved_count: mergedFaults.filter(f => !f.is_resolved).length
    }
  }).sort((a, b) => b.fault_count - a.fault_count)
}

export function calcFaultsByCode(faultLogs) {
  const counts = {}
  
  faultLogs.forEach(fault => {
    if (!counts[fault.fault_code]) {
      counts[fault.fault_code] = {
        code: fault.fault_code,
        desc: fault.fault_desc,
        severity: fault.severity,
        count: 0,
        resolved: 0,
        unresolved: 0
      }
    }
    counts[fault.fault_code].count++
    if (fault.is_resolved) {
      counts[fault.fault_code].resolved++
    } else {
      counts[fault.fault_code].unresolved++
    }
  })
  
  return Object.values(counts).sort((a, b) => b.count - a.count)
}

export function calcFaultsByHour(faultLogs) {
  const hours = Array(24).fill(0).map((_, i) => ({ hour: i, count: 0 }))
  
  faultLogs.forEach(fault => {
    const hour = new Date(fault.occur_time).getHours()
    hours[hour].count++
  })
  
  return hours
}

export function calcTopAnomalies(stations, chargers, faultLogs, repairOrders) {
  const anomalies = []
  
  const stationStats = calcFaultsByStation(stations, faultLogs, chargers)
  const worstStation = stationStats[0]
  if (worstStation && worstStation.fault_count > 0) {
    anomalies.push({
      type: 'station',
      level: worstStation.fault_count >= 10 ? 'critical' : 'warning',
      title: `${worstStation.name} 故障频发`,
      description: `今日已发生 ${worstStation.fault_count} 次故障，${worstStation.unresolved_count} 次未处理`,
      station_id: worstStation.id,
      metric: worstStation.fault_count,
      metricLabel: '故障次数'
    })
  }
  
  const byCode = calcFaultsByCode(faultLogs)
  const worstCode = byCode[0]
  if (worstCode) {
    anomalies.push({
      type: 'fault_code',
      level: worstCode.severity === 'critical' ? 'critical' : 'warning',
      title: `${worstCode.code} 故障高发`,
      description: `${worstCode.desc}，共发生 ${worstCode.count} 次，${worstCode.unresolved} 次未解决`,
      fault_code: worstCode.code,
      metric: worstCode.count,
      metricLabel: '发生次数'
    })
  }
  
  const avgRepair = calcAvgRepairTime(repairOrders)
  if (avgRepair.avg > 3) {
    anomalies.push({
      type: 'repair_time',
      level: 'warning',
      title: '维修效率偏低',
      description: `平均维修耗时 ${avgRepair.avg} 小时，超过目标阈值`,
      metric: avgRepair.avg,
      metricLabel: '平均耗时(小时)'
    })
  }
  
  const dupRate = calcDuplicateRate(faultLogs)
  if (dupRate.rate > 0.15) {
    anomalies.push({
      type: 'duplicate',
      level: 'warning',
      title: '重复报修率过高',
      description: `重复报修率 ${(dupRate.rate * 100).toFixed(1)}%，共 ${dupRate.duplicate_count} 次重复报修`,
      metric: dupRate.duplicate_count,
      metricLabel: '重复次数'
    })
  }
  
  const offlineCount = chargers.filter(c => c.is_offline).length
  if (offlineCount >= 5) {
    anomalies.push({
      type: 'offline',
      level: offlineCount >= 10 ? 'critical' : 'warning',
      title: '离线桩数量较多',
      description: `当前有 ${offlineCount} 台桩离线，不纳入可用率计算`,
      metric: offlineCount,
      metricLabel: '离线桩数'
    })
  }
  
  return anomalies.slice(0, 3)
}
