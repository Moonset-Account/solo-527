const express = require('express')
const cors = require('cors')
const fs = require('fs')
const path = require('path')
const { createObjectCsvWriter } = require('csv-writer')
const etl = require('../data/etl/run_etl')
const config = require('../data/config/metrics_config')

const app = express()
const PORT = 8787

app.use(cors())
app.use(express.json())

const DATA_DIR = path.join(__dirname, '../data/processed')

const loadProcessedData = () => {
  try {
    const aggregated = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'aggregated_data.json'), 'utf8'))
    const workOrders = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'cleaned_work_orders.json'), 'utf8'))
    const alarms = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'alarms.json'), 'utf8'))
    const production = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'production.json'), 'utf8'))
    const equipmentStatus = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'equipment_status.json'), 'utf8'))
    return { aggregated, workOrders, alarms, production, equipmentStatus }
  } catch (e) {
    console.error('数据加载失败，尝试重新生成...', e.message)
    const { generateDateRange, generateWorkOrders, generateAlarms, generateProduction, generateEquipmentStatus } = require('../data/generator/generateData')
    const dates = generateDateRange(90)
    const rawWO = generateWorkOrders(dates)
    const alarmsData = generateAlarms(rawWO)
    const productionData = generateProduction(dates, rawWO)
    const equipmentStatusData = generateEquipmentStatus(dates, rawWO)
    const cleanedWO = etl.cleanWorkOrders(rawWO)
    
    const aggregated = {
      byCategory: etl.aggregateDowntimeByCategory(cleanedWO),
      byLine: etl.aggregateDowntimeByLine(cleanedWO),
      byEquipment: etl.aggregateDowntimeByEquipment(cleanedWO),
      byTechnician: etl.aggregateRepairTimeByTechnician(cleanedWO),
      spareParts: etl.aggregateSpareParts(cleanedWO),
      trend: etl.aggregateTrendData(cleanedWO),
      kpi: etl.getKpiSummary(cleanedWO, productionData),
      config: {
        downtimeCategories: config.downtimeCategories,
        productionLines: config.productionLines,
        shifts: config.shifts,
        equipment: config.equipment,
        maintenanceTeams: config.maintenanceTeams,
        updateTime: new Date().toISOString()
      }
    }
    
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
    fs.writeFileSync(path.join(DATA_DIR, 'aggregated_data.json'), JSON.stringify(aggregated, null, 2))
    fs.writeFileSync(path.join(DATA_DIR, 'cleaned_work_orders.json'), JSON.stringify(cleanedWO, null, 2))
    fs.writeFileSync(path.join(DATA_DIR, 'alarms.json'), JSON.stringify(alarmsData, null, 2))
    fs.writeFileSync(path.join(DATA_DIR, 'production.json'), JSON.stringify(productionData, null, 2))
    fs.writeFileSync(path.join(DATA_DIR, 'equipment_status.json'), JSON.stringify(equipmentStatusData, null, 2))
    
    return { aggregated, workOrders: cleanedWO, alarms: alarmsData, production: productionData, equipmentStatus: equipmentStatusData }
  }
}

let cache = null
let cacheTime = null
const CACHE_TTL = 5 * 60 * 1000

const getCachedData = () => {
  if (cache && cacheTime && (Date.now() - cacheTime) < CACHE_TTL) {
    return cache
  }
  cache = loadProcessedData()
  cacheTime = Date.now()
  return cache
}

const invalidateCache = () => {
  cache = null
  cacheTime = null
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.get('/api/config', (req, res) => {
  const { aggregated } = getCachedData()
  res.json({
    ...aggregated.config,
    downtimeTypes: config.downtimeTypes,
    spareParts: config.spareParts,
    plannedMaintenanceTypes: config.plannedMaintenanceTypes
  })
})

app.get('/api/kpi', (req, res) => {
  const { aggregated, workOrders, production } = getCachedData()
  const filters = req.query
  const kpi = etl.getKpiSummary(workOrders, production, filters)
  res.json({
    ...kpi,
    updateTime: aggregated.config.updateTime
  })
})

app.get('/api/downtime/category', (req, res) => {
  const { workOrders } = getCachedData()
  const filters = req.query
  const data = etl.aggregateDowntimeByCategory(workOrders, filters)
  res.json(data)
})

app.get('/api/downtime/line', (req, res) => {
  const { workOrders } = getCachedData()
  const filters = req.query
  const data = etl.aggregateDowntimeByLine(workOrders, filters)
  res.json(data)
})

app.get('/api/downtime/equipment', (req, res) => {
  const { workOrders } = getCachedData()
  const filters = req.query
  const data = etl.aggregateDowntimeByEquipment(workOrders, filters)
  res.json(data)
})

app.get('/api/downtime/technician', (req, res) => {
  const { workOrders } = getCachedData()
  const filters = req.query
  const data = etl.aggregateRepairTimeByTechnician(workOrders, filters)
  res.json(data)
})

app.get('/api/spare-parts', (req, res) => {
  const { workOrders } = getCachedData()
  const filters = req.query
  const data = etl.aggregateSpareParts(workOrders, filters)
  res.json(data)
})

app.get('/api/trend', (req, res) => {
  const { workOrders } = getCachedData()
  const filters = req.query
  const data = etl.aggregateTrendData(workOrders, filters)
  res.json(data)
})

app.get('/api/workorders', (req, res) => {
  const { workOrders } = getCachedData()
  let filtered = workOrders
  const { page = 1, pageSize = 20, ...filters } = req.query
  
  if (filters.startDate) filtered = filtered.filter(wo => wo.date >= filters.startDate)
  if (filters.endDate) filtered = filtered.filter(wo => wo.date <= filters.endDate)
  if (filters.lineId) filtered = filtered.filter(wo => wo.lineId === filters.lineId)
  if (filters.equipmentId) filtered = filtered.filter(wo => wo.equipmentId === filters.equipmentId)
  if (filters.category) filtered = filtered.filter(wo => wo.category === filters.category)
  if (filters.shift) filtered = filtered.filter(wo => wo.shift === filters.shift)
  if (filters.type) filtered = filtered.filter(wo => wo.type === filters.type)
  if (filters.technician) filtered = filtered.filter(wo => wo.technician === filters.technician)
  if (filters.partId) filtered = filtered.filter(wo => wo.partsUsed.some(p => p.partId === filters.partId))
  
  const total = filtered.length
  const start = (page - 1) * pageSize
  const items = filtered.slice(start, start + parseInt(pageSize))
  
  res.json({
    items,
    total,
    page: parseInt(page),
    pageSize: parseInt(pageSize),
    totalPages: Math.ceil(total / pageSize)
  })
})

app.get('/api/workorders/:id', (req, res) => {
  const { workOrders, alarms } = getCachedData()
  const wo = workOrders.find(w => w.id === req.params.id)
  if (!wo) {
    return res.status(404).json({ error: '工单不存在' })
  }
  const relatedAlarms = alarms.filter(a => a.workOrderId === wo.id)
  res.json({
    ...wo,
    relatedAlarms
  })
})

app.get('/api/alarms', (req, res) => {
  const { alarms } = getCachedData()
  let filtered = alarms
  const { workOrderId, equipmentId, startDate, endDate } = req.query
  
  if (workOrderId) filtered = filtered.filter(a => a.workOrderId === workOrderId)
  if (equipmentId) filtered = filtered.filter(a => a.equipmentId === equipmentId)
  if (startDate) filtered = filtered.filter(a => a.time >= startDate)
  if (endDate) filtered = filtered.filter(a => a.time <= endDate + ' 23:59:59')
  
  res.json(filtered)
})

app.get('/api/export/csv/workorders', (req, res) => {
  const { workOrders } = getCachedData()
  let filtered = workOrders
  const filters = req.query
  
  if (filters.startDate) filtered = filtered.filter(wo => wo.date >= filters.startDate)
  if (filters.endDate) filtered = filtered.filter(wo => wo.date <= filters.endDate)
  if (filters.lineId) filtered = filtered.filter(wo => wo.lineId === filters.lineId)
  if (filters.type) filtered = filtered.filter(wo => wo.type === filters.type)
  
  const records = filtered.map(wo => ({
    id: wo.id,
    date: wo.date,
    shift: wo.shiftName,
    line: wo.lineName,
    equipment: wo.equipmentName,
    type: wo.typeName,
    category: wo.categoryName,
    durationMinutes: wo.durationMinutes,
    repairTimeMinutes: wo.repairTimeMinutes,
    technician: wo.technician,
    team: wo.teamName,
    partsCost: wo.partsCost.toFixed(2),
    laborCost: wo.laborCost.toFixed(2),
    totalCost: wo.totalCost.toFixed(2),
    startTime: wo.startTime,
    endTime: wo.endTime,
    description: wo.description,
    notes: wo.notes
  }))
  
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename=work_orders_${Date.now()}.csv`)
  
  const header = ['工单号', '日期', '班次', '产线', '设备', '类型', '故障类别', '停机时长(分钟)', '维修时长(分钟)', '维修人员', '班组', '备件成本', '人工成本', '总成本', '开始时间', '结束时间', '描述', '备注']
  res.write('\uFEFF' + header.join(',') + '\n')
  
  records.forEach(r => {
    const row = [
      r.id, r.date, r.shift, r.line, r.equipment, r.type, r.category,
      r.durationMinutes, r.repairTimeMinutes, r.technician, r.team,
      r.partsCost, r.laborCost, r.totalCost, r.startTime, r.endTime,
      `"${r.description}"`, `"${r.notes}"`
    ]
    res.write(row.join(',') + '\n')
  })
  
  res.end()
})

app.get('/api/export/csv/downtime-summary', (req, res) => {
  const { workOrders } = getCachedData()
  const filters = req.query
  const byCategory = etl.aggregateDowntimeByCategory(workOrders, filters)
  const byLine = etl.aggregateDowntimeByLine(workOrders, filters)
  
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename=downtime_summary_${Date.now()}.csv`)
  
  res.write('\uFEFF=== 按故障类别统计 ===\n')
  res.write('类别,停机次数,停机时长(分钟),计划停机时长,突发停机时长,占比,累计占比,总成本\n')
  byCategory.forEach(item => {
    res.write(`${item.categoryName},${item.count},${item.totalMinutes},${item.plannedMinutes},${item.unplannedMinutes},${(item.percentage*100).toFixed(2)}%,${(item.cumulativePercentage*100).toFixed(2)}%,${item.totalCost.toFixed(2)}\n`)
  })
  
  res.write('\n=== 按产线统计 ===\n')
  res.write('产线,停机次数,停机时长(分钟),计划停机时长,突发停机时长,平均时长,MTTR,总成本\n')
  byLine.forEach(item => {
    res.write(`${item.lineName},${item.count},${item.totalMinutes},${item.plannedMinutes},${item.unplannedMinutes},${item.avgDuration},${item.mttr},${item.totalCost.toFixed(2)}\n`)
  })
  
  res.end()
})

app.get('/api/equipment-status', (req, res) => {
  const { equipmentStatus } = getCachedData()
  let filtered = equipmentStatus
  const { equipmentId, lineId, startDate, endDate } = req.query
  
  if (equipmentId) filtered = filtered.filter(e => e.equipmentId === equipmentId)
  if (lineId) filtered = filtered.filter(e => e.lineId === lineId)
  if (startDate) filtered = filtered.filter(e => e.date >= startDate)
  if (endDate) filtered = filtered.filter(e => e.date <= endDate)
  
  res.json(filtered)
})

app.post('/api/refresh', (req, res) => {
  invalidateCache()
  const data = getCachedData()
  res.json({
    status: 'refreshed',
    updateTime: data.aggregated.config.updateTime,
    workOrderCount: data.workOrders.length,
    equipmentStatusCount: data.equipmentStatus.length
  })
})

app.get('/api/dashboard/all', (req, res) => {
  const { aggregated, workOrders, production, equipmentStatus } = getCachedData()
  const filters = req.query
  
  res.json({
    kpi: etl.getKpiSummary(workOrders, production, filters),
    byCategory: etl.aggregateDowntimeByCategory(workOrders, filters),
    byLine: etl.aggregateDowntimeByLine(workOrders, filters),
    byEquipment: etl.aggregateDowntimeByEquipment(workOrders, filters).slice(0, 10),
    byTechnician: etl.aggregateRepairTimeByTechnician(workOrders, filters),
    spareParts: etl.aggregateSpareParts(workOrders, filters).slice(0, 10),
    trend: etl.aggregateTrendData(workOrders, filters),
    equipmentStatusSummary: equipmentStatus.slice(0, 100),
    updateTime: aggregated.config.updateTime
  })
})

app.listen(PORT, () => {
  console.log(`服务已启动: http://localhost:${PORT}`)
  console.log('正在初始化数据...')
  getCachedData()
  console.log('数据初始化完成')
})
