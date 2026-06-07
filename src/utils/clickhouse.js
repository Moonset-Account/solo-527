/**
 * ClickHouse 查询适配器
 * 
 * 这个模块封装了前端与 ClickHouse 的交互逻辑
 * 实际部署时通过 HTTP 接口调用 ClickHouse
 * 当前使用 Mock 数据模拟，便于本地开发
 * 
 * 使用方式:
 * 1. 部署 ClickHouse 服务并执行 clickhouse/ddl/ 下的建表脚本
 * 2. 用 clickhouse/scripts/import_data.sh 导入数据
 * 3. 配置 CH_ENDPOINT 环境变量指向实际的 ClickHouse HTTP 接口
 */

import { generateAllData } from '../data/mock/generator.js'

const CH_HTTP_ENDPOINT = import.meta.env.VITE_CH_ENDPOINT || ''
const CH_DATABASE = import.meta.env.VITE_CH_DATABASE || 'charger_monitor'
const CH_USER = import.meta.env.VITE_CH_USER || 'default'
const CH_PASSWORD = import.meta.env.VITE_CH_PASSWORD || ''

const USE_MOCK = !CH_HTTP_ENDPOINT

let mockData = null

function getMockData() {
  if (!mockData) {
    mockData = generateAllData()
  }
  return mockData
}

async function executeQuery(sql, params = {}) {
  if (USE_MOCK) {
    console.debug('[ClickHouse Mock] 执行查询:', sql.slice(0, 100) + '...')
    return mockQuery(sql, params)
  }
  
  const url = `${CH_HTTP_ENDPOINT}/?database=${CH_DATABASE}&query=`
  const queryWithParams = substituteParams(sql, params)
  
  try {
    const response = await fetch(url + encodeURIComponent(queryWithParams + ' FORMAT JSON'), {
      method: 'GET',
      headers: {
        'X-ClickHouse-User': CH_USER,
        'X-ClickHouse-Key': CH_PASSWORD,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`ClickHouse query failed: ${response.statusText}`)
    }
    
    const result = await response.json()
    return result.data || []
  } catch (err) {
    console.error('ClickHouse 查询失败:', err)
    throw err
  }
}

function substituteParams(sql, params) {
  let result = sql
  Object.entries(params).forEach(([key, value]) => {
    const placeholder = `{${key}}`
    if (Array.isArray(value)) {
      result = result.replaceAll(placeholder, `[${value.map(v => `'${v}'`).join(',')}]`)
    } else if (typeof value === 'string') {
      result = result.replaceAll(placeholder, `'${value}'`)
    } else {
      result = result.replaceAll(placeholder, value)
    }
  })
  return result
}

function mockQuery(sql, params) {
  const data = getMockData()
  
  if (sql.includes('availability_rate') || sql.includes('online_total')) {
    const online = data.chargers.filter(c => !c.is_offline)
    const faultyFromStatus = new Set(online.filter(c => c.status === 'fault').map(c => c.id))
    
    let faultsInRange = data.faultLogs
    if (params.startTime && params.endTime) {
      const start = new Date(params.startTime).getTime()
      const end = new Date(params.endTime).getTime()
      faultsInRange = faultsInRange.filter(f => {
        const t = new Date(f.occur_time).getTime()
        return t >= start && t <= end
      })
    }
    const faultyFromLogs = new Set(faultsInRange.map(f => f.charger_id))
    const allFaulty = new Set([...faultyFromStatus, ...faultyFromLogs])
    
    const normal = online.filter(c => !allFaulty.has(c.id)).length
    
    return [{
      online_total: online.length,
      online_faulty: online.length - normal,
      online_normal: normal,
      availability_rate: normal / online.length,
      offline_count: data.chargers.filter(c => c.is_offline).length
    }]
  }
  
  if (sql.includes('GROUP BY s.station_id') && sql.includes('fault_count')) {
    return mockFaultsByStation(data, params)
  }
  
  if (sql.includes('GROUP BY fault_code') && sql.includes('repair_hours')) {
    return mockRepairTime(data, params)
  }
  
  if (sql.includes('GROUP BY hour')) {
    return mockFaultsByHour(data, params)
  }
  
  if (sql.includes('anomaly_type')) {
    return mockTopAnomalies(data)
  }
  
  if (sql.includes('fact_power_reading')) {
    return mockPowerReadings(data, params)
  }
  
  if (sql.includes('duplicate_rate')) {
    return mockDuplicateRate(data, params)
  }
  
  return []
}

function mockFaultsByStation(data, params) {
  const stations = data.stations
  const faultLogs = data.faultLogs
  const chargers = data.chargers
  
  return stations.map(station => {
    const stationChargers = chargers.filter(c => c.station_id === station.id)
    const stationFaults = faultLogs.filter(f => f.station_id === station.id)
    
    let faultsInRange = stationFaults
    if (params.startTime && params.endTime) {
      const start = new Date(params.startTime).getTime()
      const end = new Date(params.endTime).getTime()
      faultsInRange = stationFaults.filter(f => {
        const t = new Date(f.occur_time).getTime()
        return t >= start && t <= end
      })
    }
    
    const onlineChargers = stationChargers.filter(c => !c.is_offline)
    const faultyFromLogs = new Set(faultsInRange.map(f => f.charger_id))
    const faultyFromStatus = new Set(onlineChargers.filter(c => c.status === 'fault').map(c => c.id))
    const allFaulty = new Set([...faultyFromLogs, ...faultyFromStatus])
    const normal = onlineChargers.filter(c => !allFaulty.has(c.id)).length
    
    return {
      ...station,
      fault_count: faultsInRange.length,
      charger_count: stationChargers.length,
      availability: onlineChargers.length > 0 ? normal / onlineChargers.length : 1,
      online_chargers: onlineChargers.length,
      offline_chargers: stationChargers.filter(c => c.is_offline).length,
      unresolved_count: faultsInRange.filter(f => !f.is_resolved).length
    }
  }).sort((a, b) => b.fault_count - a.fault_count)
}

function mockRepairTime(data, params) {
  const byCode = {}
  const completed = data.repairOrders.filter(o => o.status === 'completed' && o.repair_hours != null)
  
  completed.forEach(o => {
    if (!byCode[o.fault_code]) {
      byCode[o.fault_code] = []
    }
    byCode[o.fault_code].push(o.repair_hours)
  })
  
  return Object.entries(byCode).map(([code, hours]) => {
    const sorted = [...hours].sort((a, b) => a - b)
    const meta = data.faultCodeMeta.find(f => f.code === code)
    return {
      fault_code: code,
      fault_desc: meta?.desc || code,
      severity: meta?.severity || 'medium',
      sample_size: hours.length,
      q1: quantile(sorted, 0.25),
      median: quantile(sorted, 0.5),
      q3: quantile(sorted, 0.75),
      min_hours: Math.min(...hours),
      max_hours: Math.max(...hours),
      avg_hours: hours.reduce((a, b) => a + b, 0) / hours.length
    }
  }).sort((a, b) => b.avg_hours - a.avg_hours).slice(0, 10)
}

function quantile(sorted, q) {
  const pos = (sorted.length - 1) * q
  const base = Math.floor(pos)
  const rest = pos - base
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base])
  }
  return sorted[base]
}

function mockFaultsByHour(data, params) {
  const hours = Array(24).fill(0).map((_, i) => ({ hour: i, fault_count: 0 }))
  
  let faults = data.faultLogs
  if (params.startTime && params.endTime) {
    const start = new Date(params.startTime).getTime()
    const end = new Date(params.endTime).getTime()
    faults = faults.filter(f => {
      const t = new Date(f.occur_time).getTime()
      return t >= start && t <= end
    })
  }
  
  faults.forEach(f => {
    const h = new Date(f.occur_time).getHours()
    hours[h].fault_count++
  })
  
  return hours
}

function mockTopAnomalies(data) {
  const stations = data.stations
  const chargers = data.chargers
  const faultLogs = data.faultLogs
  const repairOrders = data.repairOrders
  
  const stationStats = stations.map(station => {
    const sc = chargers.filter(c => c.station_id === station.id)
    const sf = faultLogs.filter(f => f.station_id === station.id)
    return { ...station, fault_count: sf.length, unresolved_count: sf.filter(f => !f.is_resolved).length }
  }).sort((a, b) => b.fault_count - a.fault_count)
  
  const anomalies = []
  
  const worstStation = stationStats[0]
  if (worstStation && worstStation.fault_count > 0) {
    anomalies.push({
      anomaly_type: 'station',
      entity_id: worstStation.id,
      entity_name: worstStation.name,
      metric_value: worstStation.fault_count,
      metric_label: '故障次数',
      level: worstStation.fault_count >= 10 ? 'critical' : 'warning',
      title: `${worstStation.name} 故障频发`,
      description: `今日已发生 ${worstStation.fault_count} 次故障，${worstStation.unresolved_count} 次未处理`
    })
  }
  
  const byCode = {}
  faultLogs.forEach(f => {
    if (!byCode[f.fault_code]) {
      byCode[f.fault_code] = { count: 0, unresolved: 0, desc: f.fault_desc, severity: f.severity }
    }
    byCode[f.fault_code].count++
    if (!f.is_resolved) byCode[f.fault_code].unresolved++
  })
  const codeEntries = Object.entries(byCode).sort((a, b) => b[1].count - a[1].count)
  if (codeEntries.length > 0) {
    const [code, info] = codeEntries[0]
    anomalies.push({
      anomaly_type: 'fault_code',
      entity_id: code,
      entity_name: code,
      metric_value: info.count,
      metric_label: '发生次数',
      level: info.severity === 'critical' ? 'critical' : 'warning',
      title: `${code} 故障高发`,
      description: `${info.desc}，共发生 ${info.count} 次，${info.unresolved} 次未解决`
    })
  }
  
  const completed = repairOrders.filter(o => o.status === 'completed' && o.repair_hours != null)
  if (completed.length > 0) {
    const avg = completed.reduce((a, b) => a + b.repair_hours, 0) / completed.length
    if (avg > 3) {
      anomalies.push({
        anomaly_type: 'repair_time',
        entity_id: '',
        entity_name: '维修效率',
        metric_value: parseFloat(avg.toFixed(1)),
        metric_label: '平均耗时(小时)',
        level: 'warning',
        title: '维修效率偏低',
        description: `平均维修耗时 ${avg.toFixed(1)} 小时，超过目标阈值`
      })
    }
  }
  
  return anomalies.slice(0, 3)
}

function mockPowerReadings(data, params) {
  return data.powerReadings.slice(0, 2000)
}

function mockDuplicateRate(data, params) {
  const faultLogs = data.faultLogs
  const WINDOW_MS = 72 * 60 * 60 * 1000
  
  const sorted = [...faultLogs].sort((a, b) => new Date(a.occur_time) - new Date(b.occur_time))
  const merged = []
  
  for (const fault of sorted) {
    const occurTime = new Date(fault.occur_time).getTime()
    const lastMatch = merged.find(m => 
      m.charger_id === fault.charger_id &&
      m.fault_code === fault.fault_code &&
      occurTime - new Date(m.first_occur_time).getTime() <= WINDOW_MS
    )
    
    if (lastMatch) {
      lastMatch.duplicate_count = (lastMatch.duplicate_count || 1) + 1
    } else {
      merged.push({
        ...fault,
        duplicate_count: 1,
        first_occur_time: fault.occur_time
      })
    }
  }
  
  const duplicateCount = merged.reduce((acc, d) => acc + Math.max(0, d.duplicate_count - 1), 0)
  
  return [{
    original_count: faultLogs.length,
    merged_count: merged.length,
    duplicate_count: duplicateCount,
    duplicate_rate: faultLogs.length > 0 ? duplicateCount / faultLogs.length : 0
  }]
}

export const chApi = {
  query: executeQuery,
  
  async getAvailability(timeRange) {
    const [start, end] = timeRange
    return executeQuery(`
      SELECT * FROM (SELECT 
        countIf(c.is_offline = 0) as online_total,
        countIf(c.is_offline = 0 AND c.status = 'fault') as online_faulty,
        round(online_normal / online_total, 4) as availability_rate
      FROM dim_charger c)
    `, { startTime: start, endTime: end })
  },
  
  async getFaultsByStation(timeRange) {
    const [start, end] = timeRange
    return executeQuery(`
      SELECT s.station_id, count() as fault_count
      FROM dim_station s LEFT JOIN fact_fault_log f ON s.station_id = f.station_id
      WHERE f.occur_time BETWEEN {startTime} AND {endTime}
      GROUP BY s.station_id
    `, { startTime: start, endTime: end })
  },
  
  async getRepairTimeDistribution(timeRange) {
    const [start, end] = timeRange
    return executeQuery(`
      SELECT fault_code, quantiles(0.25, 0.5, 0.75)(repair_hours) as q
      FROM fact_repair_order
      WHERE status = 'completed' AND create_time BETWEEN {startTime} AND {endTime}
      GROUP BY fault_code
    `, { startTime: start, endTime: end })
  },
  
  async getFaultsByHour(timeRange) {
    const [start, end] = timeRange
    return executeQuery(`
      SELECT toHour(occur_time) as hour, count() as fault_count
      FROM fact_fault_log
      WHERE occur_time BETWEEN {startTime} AND {endTime}
      GROUP BY hour
    `, { startTime: start, endTime: end })
  },
  
  async getTopAnomalies() {
    return executeQuery(`
      SELECT 'station' as anomaly_type, station_id as entity_id
      FROM fact_fault_log WHERE occur_time >= today()
      GROUP BY station_id ORDER BY count() DESC LIMIT 1
    `)
  },
  
  isMock: () => USE_MOCK
}

export default chApi
