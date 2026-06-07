const fs = require('fs')
const path = require('path')
const { generateDateRange, generateWorkOrders, generateAlarms, generateProduction, generateEquipmentStatus } = require('./data/generator/generateData')
const etl = require('./data/etl/run_etl')

const dates = generateDateRange(90)
const rawWO = generateWorkOrders(dates)
const alarms = generateAlarms(rawWO)
const production = generateProduction(dates, rawWO)
const equipmentStatus = generateEquipmentStatus(dates, rawWO)
const cleanedWO = etl.cleanWorkOrders(rawWO)

const processedDir = path.join(__dirname, 'data/processed')
if (!fs.existsSync(processedDir)) fs.mkdirSync(processedDir, { recursive: true })

const config = require('./data/config/metrics_config')

const aggregated = {
  byCategory: etl.aggregateDowntimeByCategory(cleanedWO),
  byLine: etl.aggregateDowntimeByLine(cleanedWO),
  byEquipment: etl.aggregateDowntimeByEquipment(cleanedWO),
  byTechnician: etl.aggregateRepairTimeByTechnician(cleanedWO),
  spareParts: etl.aggregateSpareParts(cleanedWO),
  trend: etl.aggregateTrendData(cleanedWO),
  kpi: etl.getKpiSummary(cleanedWO, production),
  config: {
    downtimeCategories: config.downtimeCategories,
    productionLines: config.productionLines,
    shifts: config.shifts,
    equipment: config.equipment,
    maintenanceTeams: config.maintenanceTeams,
    updateTime: new Date().toISOString()
  }
}

fs.writeFileSync(path.join(processedDir, 'aggregated_data.json'), JSON.stringify(aggregated))
fs.writeFileSync(path.join(processedDir, 'cleaned_work_orders.json'), JSON.stringify(cleanedWO))
fs.writeFileSync(path.join(processedDir, 'alarms.json'), JSON.stringify(alarms))
fs.writeFileSync(path.join(processedDir, 'production.json'), JSON.stringify(production))
fs.writeFileSync(path.join(processedDir, 'equipment_status.json'), JSON.stringify(equipmentStatus))

console.log('数据生成完成:')
console.log('  工单:', cleanedWO.length)
console.log('  报警:', alarms.length)
console.log('  产量:', production.length)
console.log('  设备状态:', equipmentStatus.length)
console.log('  processed目录文件:', fs.readdirSync(processedDir).join(', '))
console.log('  OEE:', aggregated.kpi.avgOEE)
