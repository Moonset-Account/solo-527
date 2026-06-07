#!/usr/bin/env node
/**
 * 生成 ClickHouse 导入用的 CSV 示例数据
 * 用法: node clickhouse/scripts/generate_csv.js
 * 输出: clickhouse/data/*.csv
 * 
 * 注意: CSV 列顺序与 clickhouse/ddl/01_create_tables.sql 建表字段严格对应
 */

import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { generateAllData } from '../../src/data/mock/generator.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataDir = join(__dirname, '..', 'data')

mkdirSync(dataDir, { recursive: true })

console.log('='.repeat(60))
console.log('生成 ClickHouse 导入 CSV 数据...')
console.log('='.repeat(60))

const data = generateAllData()

function formatDateTime(iso) {
  if (!iso) return '0000-00-00 00:00:00'
  const d = new Date(iso)
  return d.toISOString().replace('T', ' ').slice(0, 19)
}

function formatDate(iso) {
  if (!iso) return '0000-00-00'
  const d = new Date(iso)
  return d.toISOString().slice(0, 10)
}

function escapeCSV(val) {
  if (val == null) return ''
  if (typeof val === 'object') return JSON.stringify(val)
  const str = String(val)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"'
  }
  return str
}

function toCSV(rows, headers) {
  const lines = [headers.join(',')]
  rows.forEach(row => {
    const values = headers.map(h => {
      let val = row[h]
      if (val == null) return ''
      if (h.includes('_time') && !h.includes('repair_hours')) {
        val = formatDateTime(val)
      }
      if (h === 'install_date') {
        val = formatDate(val)
      }
      return escapeCSV(val)
    })
    lines.push(values.join(','))
  })
  return lines.join('\n')
}

function writeCSV(filename, rows, headers, label) {
  writeFileSync(join(dataDir, filename), toCSV(rows, headers))
  console.log(`  ✓ ${filename.padEnd(22)} (${String(rows.length).padStart(5)} 条) - ${label}`)
}

// ========== 1. dim_station ==========
const stations = data.stations.map(s => ({
  station_id: s.id,
  station_name: s.name,
  region: s.region,
  address: s.address,
  lat: s.lat,
  lng: s.lng,
  create_time: s.create_time,
  update_time: new Date().toISOString()
}))
writeCSV('dim_station.csv', stations,
  ['station_id', 'station_name', 'region', 'address', 'lat', 'lng', 'create_time', 'update_time'],
  '站点维表')

// ========== 2. dim_charger ==========
const chargers = data.chargers.map(c => ({
  charger_id: c.id,
  station_id: c.station_id,
  model: c.model,
  brand: c.brand,
  rated_power: c.rated_power,
  install_date: c.install_date,
  status: c.status,
  is_offline: c.is_offline ? 1 : 0,
  update_time: new Date().toISOString()
}))
writeCSV('dim_charger.csv', chargers,
  ['charger_id', 'station_id', 'model', 'brand', 'rated_power', 'install_date', 'status', 'is_offline', 'update_time'],
  '充电桩维表')

// ========== 3. dim_fault_code ==========
const faultCodes = data.faultCodeMeta.map(f => ({
  fault_code: f.code,
  fault_desc: f.desc,
  severity: f.severity,
  avg_repair_hours: f.avgRepairHours,
  update_time: new Date().toISOString()
}))
writeCSV('dim_fault_code.csv', faultCodes,
  ['fault_code', 'fault_desc', 'severity', 'avg_repair_hours', 'update_time'],
  '故障码维表')

// ========== 4. dim_repair_person ==========
const repairPersons = data.repairPersons.map(p => ({
  person_id: p.id,
  person_name: p.name,
  team: p.team,
  phone: '138' + String(Math.floor(Math.random() * 100000000)).padStart(8, '0'),
  update_time: new Date().toISOString()
}))
writeCSV('dim_repair_person.csv', repairPersons,
  ['person_id', 'person_name', 'team', 'phone', 'update_time'],
  '维修人员维表')

// ========== 5. fact_charging_session ==========
const sessions = data.sessions.map(s => ({
  session_id: s.id,
  charger_id: s.charger_id,
  station_id: s.station_id,
  start_time: s.start_time,
  end_time: s.end_time,
  duration_min: s.duration_min,
  total_kwh: s.total_kwh,
  avg_power: s.avg_power,
  peak_power: s.peak_power,
  car_model: s.car_model,
  payment_amount: s.payment_amount,
  create_time: s.start_time
}))
writeCSV('fact_charging_session.csv', sessions,
  ['session_id', 'charger_id', 'station_id', 'start_time', 'end_time', 'duration_min', 'total_kwh', 'avg_power', 'peak_power', 'car_model', 'payment_amount', 'create_time'],
  '充电会话事实表')

// ========== 6. fact_power_reading ==========
const powerReadings = data.powerReadings.map(p => ({
  reading_id: p.id,
  session_id: p.session_id,
  charger_id: p.charger_id,
  timestamp: p.timestamp,
  power: p.power,
  voltage: p.voltage,
  current: p.current,
  temp_c: p.temp_c,
  is_anomaly: p.is_anomaly ? 1 : 0,
  create_time: p.timestamp
}))
writeCSV('fact_power_reading.csv', powerReadings,
  ['reading_id', 'session_id', 'charger_id', 'timestamp', 'power', 'voltage', 'current', 'temp_c', 'is_anomaly', 'create_time'],
  '功率读数事实表')

// ========== 7. fact_fault_log ==========
const faultLogs = data.faultLogs.map(f => ({
  fault_id: f.id,
  charger_id: f.charger_id,
  station_id: f.station_id,
  fault_code: f.fault_code,
  severity: f.severity,
  occur_time: f.occur_time,
  resolve_time: f.resolve_time,
  is_resolved: f.is_resolved ? 1 : 0,
  source: f.source,
  create_time: f.occur_time
}))
writeCSV('fact_fault_log.csv', faultLogs,
  ['fault_id', 'charger_id', 'station_id', 'fault_code', 'severity', 'occur_time', 'resolve_time', 'is_resolved', 'source', 'create_time'],
  '故障日志事实表')

// ========== 8. fact_repair_order ==========
const repairOrders = data.repairOrders.map(o => ({
  order_id: o.id,
  fault_id: o.fault_id,
  charger_id: o.charger_id,
  station_id: o.station_id,
  fault_code: o.fault_code,
  person_id: o.person_id,
  person_name: o.person_name,
  team: o.team,
  create_time: o.create_time,
  assign_time: o.assign_time,
  arrive_time: o.arrive_time,
  complete_time: o.complete_time,
  repair_hours: o.repair_hours,
  status: o.status,
  parts_used: (o.parts_used || []).join(';'),
  remark: o.remark,
  create_time_sys: o.create_time
}))
writeCSV('fact_repair_order.csv', repairOrders,
  ['order_id', 'fault_id', 'charger_id', 'station_id', 'fault_code', 'person_id', 'person_name', 'team', 'create_time', 'assign_time', 'arrive_time', 'complete_time', 'repair_hours', 'status', 'parts_used', 'remark', 'create_time_sys'],
  '维修工单事实表')

// ========== 9. fact_inspection (模拟数据) ==========
const inspections = []
for (let i = 0; i < 50; i++) {
  const station = data.stations[i % data.stations.length]
  inspections.push({
    inspection_id: 'INSP' + String(i + 1).padStart(6, '0'),
    station_id: station.id,
    inspector: ['王巡检', '李巡检', '张巡检'][i % 3],
    inspect_time: new Date(Date.now() - i * 86400000 * 3).toISOString(),
    charger_count: station.charger_count,
    fault_found: Math.floor(Math.random() * 3),
    items_passed: ['外观检查', '接地检测', '漏电测试'].join(';'),
    items_failed: Math.random() > 0.7 ? '显示屏' : '',
    remark: Math.random() > 0.8 ? '需更换风扇' : '',
    create_time: new Date().toISOString()
  })
}
writeCSV('fact_inspection.csv', inspections,
  ['inspection_id', 'station_id', 'inspector', 'inspect_time', 'charger_count', 'fault_found', 'items_passed', 'items_failed', 'remark', 'create_time'],
  '站点巡检表 (模拟)')

console.log('')
console.log('='.repeat(60))
console.log('✅ 所有 CSV 已生成到: clickhouse/data/')
console.log('')
console.log('下一步:')
console.log('  1. clickhouse-client --multiquery < clickhouse/ddl/01_create_tables.sql')
console.log('  2. bash clickhouse/scripts/import_data.sh')
console.log('='.repeat(60))
