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
  
  const queryWithParams = substituteParams(sql, params)
  const fullQuery = queryWithParams + ' FORMAT JSON'
  
  console.debug('[ClickHouse] 执行查询:', queryWithParams.slice(0, 100) + '...')
  
  try {
    const url = `${CH_HTTP_ENDPOINT}/`
    const body = fullQuery
    
    const headers = {
      'Content-Type': 'text/plain',
      'X-ClickHouse-Database': CH_DATABASE,
      'X-ClickHouse-User': CH_USER
    }
    if (CH_PASSWORD) {
      headers['X-ClickHouse-Key'] = CH_PASSWORD
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`ClickHouse query failed (${response.status}): ${errorText.slice(0, 200)}`)
    }
    
    const result = await response.json()
    return result.data || result || []
  } catch (err) {
    console.error('ClickHouse 查询失败:', err.message)
    console.error('  SQL:', queryWithParams.slice(0, 200))
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
    const startTime = start.replace('T', ' ').slice(0, 19)
    const endTime = end.replace('T', ' ').slice(0, 19)
    return executeQuery(`
      SELECT 
        online_total,
        online_faulty,
        online_normal,
        round(online_normal / online_total, 4) as availability_rate,
        offline_count
      FROM (
        SELECT 
          countIf(is_offline = 0) as online_total,
          countIf(is_offline = 1) as offline_count,
          countIf(is_offline = 0 AND status = 'fault') as faulty_from_status
        FROM dim_charger
      ) c
      CROSS JOIN (
        SELECT count(DISTINCT charger_id) as faulty_from_logs
        FROM fact_fault_log
        WHERE occur_time >= '${startTime}' AND occur_time <= '${endTime}'
      ) f
      ARRAY JOIN (
        SELECT 
          faulty_from_status + faulty_from_logs as online_faulty,
          online_total - (faulty_from_status + faulty_from_logs) as online_normal
      )
    `)
  },
  
  async getFaultsByStation(timeRange) {
    const [start, end] = timeRange
    const startTime = start.replace('T', ' ').slice(0, 19)
    const endTime = end.replace('T', ' ').slice(0, 19)
    return executeQuery(`
      SELECT 
        s.station_id as id,
        s.station_name as name,
        s.region,
        s.address,
        s.lat,
        s.lng,
        count(DISTINCT c.charger_id) as charger_count,
        countIf(c.is_offline = 0) as online_chargers,
        countIf(c.is_offline = 1) as offline_chargers,
        count(DISTINCT f.fault_id) as fault_count,
        countIf(f.is_resolved = 0) as unresolved_count,
        round(
          if(countIf(c.is_offline = 0) > 0,
            (countIf(c.is_offline = 0) - countIf(c.is_offline = 0 AND c.status = 'fault')) / countIf(c.is_offline = 0),
            1
          ), 4
        ) as availability
      FROM dim_station s
      LEFT JOIN dim_charger c ON s.station_id = c.station_id
      LEFT JOIN fact_fault_log f ON s.station_id = f.station_id 
        AND f.occur_time >= '${startTime}' 
        AND f.occur_time <= '${endTime}'
      GROUP BY s.station_id, s.station_name, s.region, s.address, s.lat, s.lng
      ORDER BY fault_count DESC
    `)
  },
  
  async getRepairTimeDistribution(timeRange) {
    const [start, end] = timeRange
    const startTime = start.replace('T', ' ').slice(0, 19)
    const endTime = end.replace('T', ' ').slice(0, 19)
    return executeQuery(`
      SELECT 
        fault_code,
        count() as sample_size,
        min(repair_hours) as min_hours,
        max(repair_hours) as max_hours,
        avg(repair_hours) as avg_hours,
        quantile(0.25)(repair_hours) as q1,
        quantile(0.5)(repair_hours) as median,
        quantile(0.75)(repair_hours) as q3
      FROM fact_repair_order
      WHERE status = 'completed' 
        AND create_time >= '${startTime}' 
        AND create_time <= '${endTime}'
      GROUP BY fault_code
      ORDER BY avg_hours DESC
      LIMIT 10
    `)
  },
  
  async getFaultsByHour(timeRange) {
    const [start, end] = timeRange
    const startTime = start.replace('T', ' ').slice(0, 19)
    const endTime = end.replace('T', ' ').slice(0, 19)
    return executeQuery(`
      SELECT toHour(occur_time) as hour, count() as fault_count
      FROM fact_fault_log
      WHERE occur_time >= '${startTime}' AND occur_time <= '${endTime}'
      GROUP BY hour
      ORDER BY hour
    `)
  },
  
  async getTopAnomalies(timeRange) {
    const [start, end] = timeRange
    const startTime = start.replace('T', ' ').slice(0, 19)
    const endTime = end.replace('T', ' ').slice(0, 19)
    return executeQuery(`
      SELECT anomaly_type, entity_id, entity_name, title, description, level, metric_value, metric_label
      FROM (
        SELECT 
          'station' as anomaly_type,
          s.station_id as entity_id,
          s.station_name as entity_name,
          concat(s.station_name, ' 故障频发') as title,
          concat('已发生 ', toString(count(f.fault_id)), ' 次故障，', toString(countIf(f.is_resolved = 0)), ' 次未处理') as description,
          if(count(f.fault_id) >= 10, 'critical', 'warning') as level,
          count(f.fault_id) as metric_value,
          '故障次数' as metric_label,
          1 as sort_order
        FROM dim_station s
        INNER JOIN fact_fault_log f ON s.station_id = f.station_id
          AND f.occur_time >= '${startTime}' AND f.occur_time <= '${endTime}'
        GROUP BY s.station_id, s.station_name
        ORDER BY count(f.fault_id) DESC
        LIMIT 1
      )
      UNION ALL
      SELECT anomaly_type, entity_id, entity_name, title, description, level, metric_value, metric_label
      FROM (
        SELECT 
          'fault_code' as anomaly_type,
          f.fault_code as entity_id,
          f.fault_code as entity_name,
          concat(f.fault_code, ' 故障高发') as title,
          concat('共发生 ', toString(count()), ' 次') as description,
          if(max(f.severity) = 'critical', 'critical', 'warning') as level,
          count() as metric_value,
          '发生次数' as metric_label,
          2 as sort_order
        FROM fact_fault_log f
        WHERE f.occur_time >= '${startTime}' AND f.occur_time <= '${endTime}'
        GROUP BY f.fault_code
        ORDER BY count() DESC
        LIMIT 1
      )
      UNION ALL
      SELECT anomaly_type, entity_id, entity_name, title, description, level, metric_value, metric_label
      FROM (
        SELECT 
          'repair' as anomaly_type,
          'slow_repair' as entity_id,
          '维修效率' as entity_name,
          '平均维修耗时过长' as title,
          concat('平均维修 ', toString(round(avg(r.repair_hours), 1)), ' 小时') as description,
          if(avg(r.repair_hours) > 3, 'warning', 'info') as level,
          round(avg(r.repair_hours), 1) as metric_value,
          '平均小时' as metric_label,
          3 as sort_order
        FROM fact_repair_order r
        WHERE r.status = 'completed' 
          AND r.create_time >= '${startTime}' AND r.create_time <= '${endTime}'
        HAVING count() > 0
        LIMIT 1
      )
      ORDER BY sort_order
    `)
  },
  
  isMock: () => USE_MOCK
}

export default chApi
