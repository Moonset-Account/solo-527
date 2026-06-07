#!/usr/bin/env node
/**
 * 生成 ClickHouse 导入用的 CSV 示例数据
 * 用法: node generate_csv.js
 * 输出: clickhouse/data/*.csv
 */

import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { generateAllData } from '../../src/data/mock/generator.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataDir = join(__dirname, '..', 'data')

mkdirSync(dataDir, { recursive: true })

const data = generateAllData()

function toCSV(rows, headers) {
  const lines = [headers.join(',')]
  rows.forEach(row => {
    const values = headers.map(h => {
      let val = row[h]
      if (val == null) return ''
      if (typeof val === 'string') {
        val = val.replace(/"/g, '""')
        if (val.includes(',') || val.includes('\n')) {
          val = `"${val}"`
        }
      }
      return val
    })
    lines.push(values.join(','))
  })
  return '\uFEFF' + lines.join('\n')
}

console.log('生成 CSV 数据...')

// 1. dim_station
writeFileSync(
  join(dataDir, 'stations.csv'),
  toCSV(data.stations, ['id', 'name', 'region', 'address', 'lat', 'lng', 'create_time', 'create_time'])
)
console.log('  ✓ stations.csv (' + data.stations.length + ' 条)')

// 2. dim_charger
writeFileSync(
  join(dataDir, 'chargers.csv'),
  toCSV(data.chargers, ['id', 'station_id', 'model', 'brand', 'rated_power', 'install_date', 'status', 'is_offline', 'install_date'])
)
console.log('  ✓ chargers.csv (' + data.chargers.length + ' 条)')

// 3. dim_fault_code
writeFileSync(
  join(dataDir, 'fault_codes.csv'),
  toCSV(data.faultCodeMeta, ['code', 'desc', 'severity', 'avgRepairHours', new Date().toISOString()])
)
console.log('  ✓ fault_codes.csv (' + data.faultCodeMeta.length + ' 条)')

// 4. dim_repair_person
writeFileSync(
  join(dataDir, 'repair_persons.csv'),
  toCSV(data.repairPersons, ['id', 'name', 'team', '13800000000', new Date().toISOString()])
)
console.log('  ✓ repair_persons.csv (' + data.repairPersons.length + ' 条)')

// 5. fact_charging_session
writeFileSync(
  join(dataDir, 'sessions.csv'),
  toCSV(data.sessions, ['id', 'charger_id', 'station_id', 'start_time', 'end_time', 'duration_min', 'total_kwh', 'avg_power', 'peak_power', 'car_model', 'payment_amount', 'start_time'])
)
console.log('  ✓ sessions.csv (' + data.sessions.length + ' 条)')

// 6. fact_power_reading
writeFileSync(
  join(dataDir, 'power_readings.csv'),
  toCSV(data.powerReadings, ['id', 'session_id', 'charger_id', 'timestamp', 'power', 'voltage', 'current', 'temp_c', 'is_anomaly', 'timestamp'])
)
console.log('  ✓ power_readings.csv (' + data.powerReadings.length + ' 条)')

// 7. fact_fault_log
writeFileSync(
  join(dataDir, 'fault_logs.csv'),
  toCSV(data.faultLogs, ['id', 'charger_id', 'station_id', 'fault_code', 'severity', 'occur_time', 'resolve_time', 'is_resolved', 'source', 'occur_time'])
)
console.log('  ✓ fault_logs.csv (' + data.faultLogs.length + ' 条)')

// 8. fact_repair_order
writeFileSync(
  join(dataDir, 'repair_orders.csv'),
  toCSV(data.repairOrders, ['id', 'fault_id', 'charger_id', 'station_id', 'fault_code', 'person_id', 'person_name', 'team', 'create_time', 'assign_time', 'arrive_time', 'complete_time', 'repair_hours', 'status', '[]', 'remark', 'create_time'])
)
console.log('  ✓ repair_orders.csv (' + data.repairOrders.length + ' 条)')

console.log('\n完成! 数据已输出到 clickhouse/data/')
console.log('下一步: 执行 clickhouse/scripts/import_data.sh 导入到 ClickHouse')
