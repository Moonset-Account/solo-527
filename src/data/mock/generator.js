import { STATION_NAMES, CHARGER_MODELS, FAULT_CODES, REPAIR_PERSONS, REGIONS } from './seed.js'

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomFloat(min, max, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals))
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomDate(daysBack = 7) {
  const now = new Date()
  const ms = now.getTime() - randomInt(0, daysBack * 24 * 60 * 60 * 1000)
  return new Date(ms)
}

function randomTodayDate() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const ms = today.getTime() + randomInt(0, 24 * 60 * 60 * 1000 - 1)
  return new Date(ms)
}

export function generateStations(count = 20) {
  const baseLat = 39.9042
  const baseLng = 116.4074
  
  return STATION_NAMES.slice(0, count).map((name, i) => ({
    id: `ST${String(i + 1).padStart(4, '0')}`,
    name,
    lat: baseLat + randomFloat(-0.08, 0.08, 6),
    lng: baseLng + randomFloat(-0.1, 0.1, 6),
    region: randomChoice(REGIONS),
    address: `${randomChoice(REGIONS)}${name}`,
    charger_count: randomInt(4, 12),
    create_time: new Date(Date.now() - randomInt(30, 365) * 86400000).toISOString()
  }))
}

export function generateChargers(stations) {
  const chargers = []
  let id = 1
  
  stations.forEach(station => {
    const count = station.charger_count
    for (let i = 0; i < count; i++) {
      const modelInfo = randomChoice(CHARGER_MODELS)
      chargers.push({
        id: `CH${String(id++).padStart(6, '0')}`,
        station_id: station.id,
        model: modelInfo.model,
        brand: modelInfo.brand,
        rated_power: modelInfo.power,
        status: randomChoice(['online', 'online', 'online', 'fault', 'offline']),
        is_offline: Math.random() < 0.08,
        install_date: new Date(Date.now() - randomInt(30, 730) * 86400000).toISOString()
      })
    }
  })
  return chargers
}

export function generateSessions(chargers, count = 2000) {
  const sessions = []
  let id = 1
  
  for (let i = 0; i < count; i++) {
    const charger = randomChoice(chargers)
    const startTime = randomDate(7)
    const duration = randomInt(15, 120)
    const endTime = new Date(startTime.getTime() + duration * 60000)
    const totalKwh = randomFloat(5, 80)
    
    sessions.push({
      id: `SE${String(id++).padStart(8, '0')}`,
      charger_id: charger.id,
      station_id: charger.station_id,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      duration_min: duration,
      total_kwh: totalKwh,
      avg_power: parseFloat((totalKwh / (duration / 60)).toFixed(2)),
      peak_power: Math.min(charger.rated_power, parseFloat((totalKwh / (duration / 60) * randomFloat(1.1, 1.4)).toFixed(2))),
      car_model: randomChoice(['特斯拉Model 3', '比亚迪汉', '蔚来ET5', '小鹏P7', '理想L7', '极氪001', '问界M5']),
      payment_amount: parseFloat((totalKwh * randomFloat(1.2, 1.8)).toFixed(2))
    })
  }
  return sessions.sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
}

export function generatePowerReadings(sessions, count = 5000) {
  const readings = []
  let id = 1
  
  const targetSessions = sessions.slice(0, Math.min(200, sessions.length))
  
  targetSessions.forEach(session => {
    const pointsPerSession = randomInt(20, 50)
    const startTime = new Date(session.start_time)
    const endTime = new Date(session.end_time)
    const totalMs = endTime - startTime
    
    for (let i = 0; i < pointsPerSession; i++) {
      const ts = new Date(startTime.getTime() + (i / pointsPerSession) * totalMs)
      const progress = i / pointsPerSession
      let basePower = session.avg_power
      
      if (progress < 0.1) basePower *= randomFloat(0.5, 0.8)
      else if (progress < 0.7) basePower *= randomFloat(0.9, 1.1)
      else basePower *= randomFloat(0.3, 0.7)
      
      const isAnomaly = Math.random() < 0.03
      if (isAnomaly) {
        basePower *= Math.random() < 0.5 ? randomFloat(0, 0.2) : randomFloat(1.5, 2.0)
      }
      
      readings.push({
        id: `PR${String(id++).padStart(9, '0')}`,
        session_id: session.id,
        charger_id: session.charger_id,
        timestamp: ts.toISOString(),
        power: Math.max(0, parseFloat(basePower.toFixed(2))),
        voltage: parseFloat(randomFloat(380, 420).toFixed(1)),
        current: parseFloat(randomFloat(50, 200).toFixed(1)),
        temp_c: parseFloat(randomFloat(25, 55).toFixed(1)),
        is_anomaly: isAnomaly
      })
    }
  })
  return readings.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
}

export function generateFaultLogs(chargers, count = 300) {
  const faults = []
  let id = 1
  
  for (let i = 0; i < count; i++) {
    const charger = randomChoice(chargers.filter(c => !c.is_offline))
    const faultInfo = randomChoice(FAULT_CODES)
    const occurTime = randomDate(7)
    
    faults.push({
      id: `FL${String(id++).padStart(7, '0')}`,
      charger_id: charger.id,
      station_id: charger.station_id,
      fault_code: faultInfo.code,
      fault_desc: faultInfo.desc,
      severity: faultInfo.severity,
      occur_time: occurTime.toISOString(),
      resolve_time: Math.random() < 0.85 
        ? new Date(occurTime.getTime() + randomInt(30, 480) * 60000).toISOString()
        : null,
      is_resolved: Math.random() < 0.85,
      source: randomChoice(['auto_detect', 'user_report', 'inspection'])
    })
  }
  
  for (let i = 0; i < 20; i++) {
    const charger = randomChoice(chargers.filter(c => !c.is_offline))
    const faultInfo = randomChoice(FAULT_CODES)
    const baseTime = randomTodayDate()
    
    for (let j = 0; j < randomInt(2, 4); j++) {
      faults.push({
        id: `FL${String(id++).padStart(7, '0')}`,
        charger_id: charger.id,
        station_id: charger.station_id,
        fault_code: faultInfo.code,
        fault_desc: faultInfo.desc,
        severity: faultInfo.severity,
        occur_time: new Date(baseTime.getTime() + j * randomInt(30, 120) * 60000).toISOString(),
        resolve_time: null,
        is_resolved: false,
        source: 'auto_detect',
        is_duplicate: true
      })
    }
  }
  
  return faults.sort((a, b) => new Date(a.occur_time) - new Date(b.occur_time))
}

export function generateRepairOrders(faultLogs) {
  const orders = []
  let id = 1
  
  faultLogs.forEach(fault => {
    if (!fault.is_resolved && Math.random() < 0.3) return
    
    const faultInfo = FAULT_CODES.find(f => f.code === fault.fault_code)
    const baseHours = faultInfo ? faultInfo.avgRepairHours : 2
    const repairHours = parseFloat(randomFloat(baseHours * 0.5, baseHours * 2).toFixed(1))
    const person = randomChoice(REPAIR_PERSONS)
    const createTime = new Date(fault.occur_time)
    const completeTime = new Date(createTime.getTime() + repairHours * 3600000)
    
    orders.push({
      id: `RO${String(id++).padStart(7, '0')}`,
      fault_id: fault.id,
      charger_id: fault.charger_id,
      station_id: fault.station_id,
      fault_code: fault.fault_code,
      person_id: person.id,
      person_name: person.name,
      team: person.team,
      create_time: createTime.toISOString(),
      assign_time: new Date(createTime.getTime() + randomInt(5, 30) * 60000).toISOString(),
      arrive_time: new Date(createTime.getTime() + randomInt(20, 90) * 60000).toISOString(),
      complete_time: fault.is_resolved ? completeTime.toISOString() : null,
      repair_hours: fault.is_resolved ? repairHours : null,
      status: fault.is_resolved ? 'completed' : randomChoice(['pending', 'in_progress']),
      parts_used: faultInfo && Math.random() < 0.4 ? [randomChoice(['充电模块', '风扇', '连接器', '电源板', '显示屏'])] : [],
      remark: fault.is_resolved ? randomChoice(['已更换部件', '固件升级解决', '现场调试完成', '清理灰尘后恢复', '更换配件']) : ''
    })
  })
  return orders
}

export function generateAllData() {
  const stations = generateStations(20)
  const chargers = generateChargers(stations)
  const sessions = generateSessions(chargers, 2000)
  const powerReadings = generatePowerReadings(sessions, 5000)
  const faultLogs = generateFaultLogs(chargers, 350)
  const repairOrders = generateRepairOrders(faultLogs)
  
  return {
    stations,
    chargers,
    sessions,
    powerReadings,
    faultLogs,
    repairOrders,
    repairPersons: REPAIR_PERSONS,
    faultCodeMeta: FAULT_CODES,
    chargerModels: CHARGER_MODELS,
    lastUpdateTime: new Date().toISOString()
  }
}
