const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const config = require('../config/metrics_config')

const loadRawData = () => {
  const rawDir = path.join(__dirname, '../raw')
  
  const workOrders = JSON.parse(fs.readFileSync(path.join(rawDir, 'work_orders.json'), 'utf8'))
  const alarms = JSON.parse(fs.readFileSync(path.join(rawDir, 'alarms.json'), 'utf8'))
  const production = JSON.parse(fs.readFileSync(path.join(rawDir, 'production.json'), 'utf8'))
  const equipmentStatus = JSON.parse(fs.readFileSync(path.join(rawDir, 'equipment_status.json'), 'utf8'))
  
  return { workOrders, alarms, production, equipmentStatus }
}

const cleanWorkOrders = (workOrders) => {
  return workOrders.map(wo => {
    let duration = wo.durationMinutes
    if (duration < config.aggregationRules.downtimeDuration.minMinutes) {
      duration = config.aggregationRules.downtimeDuration.minMinutes
    }
    const roundTo = config.aggregationRules.downtimeDuration.roundTo
    duration = Math.ceil(duration / roundTo) * roundTo
    
    return {
      ...wo,
      durationMinutes: duration,
      isPlanned: wo.type === config.downtimeTypes.PLANNED,
      isUnplanned: wo.type === config.downtimeTypes.UNPLANNED,
      hasParts: wo.partsUsed && wo.partsUsed.length > 0
    }
  })
}

const aggregateDowntimeByCategory = (workOrders, filters = {}) => {
  let filtered = workOrders
  
  if (filters.startDate) {
    filtered = filtered.filter(wo => wo.date >= filters.startDate)
  }
  if (filters.endDate) {
    filtered = filtered.filter(wo => wo.date <= filters.endDate)
  }
  if (filters.lineId) {
    filtered = filtered.filter(wo => wo.lineId === filters.lineId)
  }
  if (filters.shift) {
    filtered = filtered.filter(wo => wo.shift === filters.shift)
  }
  if (filters.type) {
    filtered = filtered.filter(wo => wo.type === filters.type)
  }
  
  const byCategory = {}
  
  filtered.forEach(wo => {
    if (!byCategory[wo.category]) {
      byCategory[wo.category] = {
        category: wo.category,
        categoryName: wo.categoryName,
        count: 0,
        totalMinutes: 0,
        totalCost: 0,
        plannedCount: 0,
        unplannedCount: 0,
        plannedMinutes: 0,
        unplannedMinutes: 0
      }
    }
    byCategory[wo.category].count++
    byCategory[wo.category].totalMinutes += wo.durationMinutes
    byCategory[wo.category].totalCost += wo.totalCost
    
    if (wo.isPlanned) {
      byCategory[wo.category].plannedCount++
      byCategory[wo.category].plannedMinutes += wo.durationMinutes
    } else {
      byCategory[wo.category].unplannedCount++
      byCategory[wo.category].unplannedMinutes += wo.durationMinutes
    }
  })
  
  const result = Object.values(byCategory).sort((a, b) => b.totalMinutes - a.totalMinutes)
  
  const totalMinutes = result.reduce((sum, item) => sum + item.totalMinutes, 0)
  let cumulative = 0
  result.forEach(item => {
    cumulative += item.totalMinutes
    item.percentage = totalMinutes > 0 ? +(item.totalMinutes / totalMinutes).toFixed(4) : 0
    item.cumulativePercentage = totalMinutes > 0 ? +(cumulative / totalMinutes).toFixed(4) : 0
  })
  
  return result
}

const aggregateDowntimeByLine = (workOrders, filters = {}) => {
  let filtered = workOrders
  
  if (filters.startDate) {
    filtered = filtered.filter(wo => wo.date >= filters.startDate)
  }
  if (filters.endDate) {
    filtered = filtered.filter(wo => wo.date <= filters.endDate)
  }
  if (filters.shift) {
    filtered = filtered.filter(wo => wo.shift === filters.shift)
  }
  
  const byLine = {}
  
  config.productionLines.forEach(line => {
    byLine[line.id] = {
      lineId: line.id,
      lineName: line.name,
      totalMinutes: 0,
      plannedMinutes: 0,
      unplannedMinutes: 0,
      count: 0,
      plannedCount: 0,
      unplannedCount: 0,
      totalCost: 0,
      avgDuration: 0,
      mttr: 0
    }
  })
  
  filtered.forEach(wo => {
    if (!byLine[wo.lineId]) return
    
    byLine[wo.lineId].totalMinutes += wo.durationMinutes
    byLine[wo.lineId].count++
    byLine[wo.lineId].totalCost += wo.totalCost
    
    if (wo.isPlanned) {
      byLine[wo.lineId].plannedMinutes += wo.durationMinutes
      byLine[wo.lineId].plannedCount++
    } else {
      byLine[wo.lineId].unplannedMinutes += wo.durationMinutes
      byLine[wo.lineId].unplannedCount++
    }
  })
  
  Object.values(byLine).forEach(line => {
    line.avgDuration = line.count > 0 ? Math.round(line.totalMinutes / line.count) : 0
    line.mttr = line.unplannedCount > 0 ? Math.round(line.unplannedMinutes / line.unplannedCount) : 0
  })
  
  return Object.values(byLine)
}

const aggregateDowntimeByEquipment = (workOrders, filters = {}) => {
  let filtered = workOrders
  
  if (filters.startDate) filtered = filtered.filter(wo => wo.date >= filters.startDate)
  if (filters.endDate) filtered = filtered.filter(wo => wo.date <= filters.endDate)
  if (filters.lineId) filtered = filtered.filter(wo => wo.lineId === filters.lineId)
  if (filters.shift) filtered = filtered.filter(wo => wo.shift === filters.shift)
  if (filters.type) filtered = filtered.filter(wo => wo.type === filters.type)
  
  const byEq = {}
  
  filtered.forEach(wo => {
    if (!byEq[wo.equipmentId]) {
      byEq[wo.equipmentId] = {
        equipmentId: wo.equipmentId,
        equipmentName: wo.equipmentName,
        lineId: wo.lineId,
        lineName: wo.lineName,
        totalMinutes: 0,
        plannedMinutes: 0,
        unplannedMinutes: 0,
        count: 0,
        plannedCount: 0,
        unplannedCount: 0,
        totalCost: 0,
        partsCost: 0,
        avgRepairTime: 0,
        _repairTimes: []
      }
    }
    
    byEq[wo.equipmentId].totalMinutes += wo.durationMinutes
    byEq[wo.equipmentId].count++
    byEq[wo.equipmentId].totalCost += wo.totalCost
    byEq[wo.equipmentId].partsCost += wo.partsCost
    byEq[wo.equipmentId]._repairTimes.push(wo.repairTimeMinutes)
    
    if (wo.isPlanned) {
      byEq[wo.equipmentId].plannedCount++
      byEq[wo.equipmentId].plannedMinutes += wo.durationMinutes
    } else {
      byEq[wo.equipmentId].unplannedCount++
      byEq[wo.equipmentId].unplannedMinutes += wo.durationMinutes
    }
  })
  
  Object.values(byEq).forEach(eq => {
    eq.avgRepairTime = eq._repairTimes.length > 0 
      ? Math.round(eq._repairTimes.reduce((a, b) => a + b, 0) / eq._repairTimes.length) 
      : 0
    delete eq._repairTimes
  })
  
  return Object.values(byEq).sort((a, b) => b.unplannedMinutes - a.unplannedMinutes)
}

const aggregateRepairTimeByTechnician = (workOrders, filters = {}) => {
  let filtered = workOrders.filter(wo => !wo.isPlanned)
  
  if (filters.startDate) filtered = filtered.filter(wo => wo.date >= filters.startDate)
  if (filters.endDate) filtered = filtered.filter(wo => wo.date <= filters.endDate)
  if (filters.lineId) filtered = filtered.filter(wo => wo.lineId === filters.lineId)
  if (filters.teamId) filtered = filtered.filter(wo => wo.teamId === filters.teamId)
  
  const byTech = {}
  
  filtered.forEach(wo => {
    if (!byTech[wo.technician]) {
      byTech[wo.technician] = {
        technician: wo.technician,
        teamId: wo.teamId,
        teamName: wo.teamName,
        count: 0,
        totalRepairMinutes: 0,
        totalResponseMinutes: 0,
        avgRepairTime: 0,
        avgResponseTime: 0,
        totalCost: 0
      }
    }
    byTech[wo.technician].count++
    byTech[wo.technician].totalRepairMinutes += wo.repairTimeMinutes
    byTech[wo.technician].totalResponseMinutes += wo.responseTimeMinutes
    byTech[wo.technician].totalCost += wo.totalCost
  })
  
  Object.values(byTech).forEach(tech => {
    tech.avgRepairTime = Math.round(tech.totalRepairMinutes / tech.count)
    tech.avgResponseTime = Math.round(tech.totalResponseMinutes / tech.count)
  })
  
  return Object.values(byTech).sort((a, b) => a.avgRepairTime - b.avgRepairTime)
}

const aggregateSpareParts = (workOrders, filters = {}) => {
  let filtered = workOrders
  
  if (filters.startDate) filtered = filtered.filter(wo => wo.date >= filters.startDate)
  if (filters.endDate) filtered = filtered.filter(wo => wo.date <= filters.endDate)
  if (filters.lineId) filtered = filtered.filter(wo => wo.lineId === filters.lineId)
  if (filters.type) filtered = filtered.filter(wo => wo.type === filters.type)
  
  const byPart = {}
  
  filtered.forEach(wo => {
    wo.partsUsed.forEach(part => {
      if (!byPart[part.partId]) {
        byPart[part.partId] = {
          partId: part.partId,
          partName: part.partName,
          usageCount: 0,
          totalQuantity: 0,
          totalCost: 0,
          unitCost: part.unitCost,
          relatedDowntimeMinutes: 0,
          relatedWorkOrders: []
        }
      }
      byPart[part.partId].usageCount++
      byPart[part.partId].totalQuantity += part.quantity
      byPart[part.partId].totalCost += part.unitCost * part.quantity
      byPart[part.partId].relatedDowntimeMinutes += wo.durationMinutes
      if (!byPart[part.partId].relatedWorkOrders.includes(wo.id)) {
        byPart[part.partId].relatedWorkOrders.push(wo.id)
      }
    })
  })
  
  return Object.values(byPart).sort((a, b) => b.totalCost - a.totalCost)
}

const aggregateTrendData = (workOrders, filters = {}) => {
  let filtered = workOrders
  
  if (filters.startDate) filtered = filtered.filter(wo => wo.date >= filters.startDate)
  if (filters.endDate) filtered = filtered.filter(wo => wo.date <= filters.endDate)
  if (filters.lineId) filtered = filtered.filter(wo => wo.lineId === filters.lineId)
  if (filters.shift) filtered = filtered.filter(wo => wo.shift === filters.shift)
  
  const byDate = {}
  
  filtered.forEach(wo => {
    if (!byDate[wo.date]) {
      byDate[wo.date] = {
        date: wo.date,
        totalMinutes: 0,
        plannedMinutes: 0,
        unplannedMinutes: 0,
        count: 0,
        plannedCount: 0,
        unplannedCount: 0,
        totalCost: 0
      }
    }
    byDate[wo.date].totalMinutes += wo.durationMinutes
    byDate[wo.date].count++
    byDate[wo.date].totalCost += wo.totalCost
    
    if (wo.isPlanned) {
      byDate[wo.date].plannedMinutes += wo.durationMinutes
      byDate[wo.date].plannedCount++
    } else {
      byDate[wo.date].unplannedMinutes += wo.durationMinutes
      byDate[wo.date].unplannedCount++
    }
  })
  
  return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date))
}

const getKpiSummary = (workOrders, production, filters = {}) => {
  let filteredWO = workOrders
  let filteredProd = production
  
  if (filters.startDate) {
    filteredWO = filteredWO.filter(wo => wo.date >= filters.startDate)
    filteredProd = filteredProd.filter(p => p.date >= filters.startDate)
  }
  if (filters.endDate) {
    filteredWO = filteredWO.filter(wo => wo.date <= filters.endDate)
    filteredProd = filteredProd.filter(p => p.date <= filters.endDate)
  }
  if (filters.lineId) {
    filteredWO = filteredWO.filter(wo => wo.lineId === filters.lineId)
    filteredProd = filteredProd.filter(p => p.lineId === filters.lineId)
  }
  
  const unplannedWO = filteredWO.filter(wo => wo.isUnplanned)
  
  const totalUnplannedMinutes = unplannedWO.reduce((sum, wo) => sum + wo.durationMinutes, 0)
  const totalPlannedMinutes = filteredWO.filter(wo => wo.isPlanned).reduce((sum, wo) => sum + wo.durationMinutes, 0)
  const avgOEE = filteredProd.length > 0 
    ? +(filteredProd.reduce((sum, p) => sum + p.oee, 0) / filteredProd.length).toFixed(4) 
    : 0
  
  const mttr = unplannedWO.length > 0
    ? Math.round(unplannedWO.reduce((sum, wo) => sum + wo.repairTimeMinutes, 0) / unplannedWO.length)
    : 0
  
  return {
    totalWorkOrders: filteredWO.length,
    unplannedCount: unplannedWO.length,
    plannedCount: filteredWO.filter(wo => wo.isPlanned).length,
    totalUnplannedMinutes,
    totalPlannedMinutes,
    totalDowntimeMinutes: totalUnplannedMinutes + totalPlannedMinutes,
    avgOEE,
    mttr,
    totalCost: +filteredWO.reduce((sum, wo) => sum + wo.totalCost, 0).toFixed(2),
    partsCost: +filteredWO.reduce((sum, wo) => sum + wo.partsCost, 0).toFixed(2)
  }
}

const main = () => {
  console.log('开始ETL处理...')
  
  const { workOrders: rawWO, alarms, production, equipmentStatus } = loadRawData()
  
  console.log(`加载原始数据: ${rawWO.length} 条工单, ${equipmentStatus.length} 条设备状态`)
  
  const cleanedWO = cleanWorkOrders(rawWO)
  
  console.log(`清洗后数据: ${cleanedWO.length} 条工单`)
  
  const aggregated = {
    byCategory: aggregateDowntimeByCategory(cleanedWO),
    byLine: aggregateDowntimeByLine(cleanedWO),
    byEquipment: aggregateDowntimeByEquipment(cleanedWO),
    byTechnician: aggregateRepairTimeByTechnician(cleanedWO),
    spareParts: aggregateSpareParts(cleanedWO),
    trend: aggregateTrendData(cleanedWO),
    kpi: getKpiSummary(cleanedWO, production),
    config: {
      downtimeCategories: config.downtimeCategories,
      productionLines: config.productionLines,
      shifts: config.shifts,
      equipment: config.equipment,
      maintenanceTeams: config.maintenanceTeams,
      updateTime: new Date().toISOString()
    }
  }
  
  const processedDir = path.join(__dirname, '../processed')
  if (!fs.existsSync(processedDir)) fs.mkdirSync(processedDir, { recursive: true })
  
  fs.writeFileSync(path.join(processedDir, 'aggregated_data.json'), JSON.stringify(aggregated, null, 2))
  fs.writeFileSync(path.join(processedDir, 'cleaned_work_orders.json'), JSON.stringify(cleanedWO, null, 2))
  fs.writeFileSync(path.join(processedDir, 'alarms.json'), JSON.stringify(alarms, null, 2))
  fs.writeFileSync(path.join(processedDir, 'production.json'), JSON.stringify(production, null, 2))
  fs.writeFileSync(path.join(processedDir, 'equipment_status.json'), JSON.stringify(equipmentStatus, null, 2))
  
  console.log('ETL处理完成！')
  console.log(`  聚合数据已保存到 data/processed/`)
  console.log(`  - 工单: ${cleanedWO.length} 条`)
  console.log(`  - 设备状态: ${equipmentStatus.length} 条`)
  console.log(`  - 报警: ${alarms.length} 条`)
  console.log(`  - 产量: ${production.length} 条`)
  
  return { aggregated, cleanedWO, alarms, production, equipmentStatus }
}

if (require.main === module) {
  main()
}

module.exports = {
  loadRawData,
  cleanWorkOrders,
  aggregateDowntimeByCategory,
  aggregateDowntimeByLine,
  aggregateDowntimeByEquipment,
  aggregateRepairTimeByTechnician,
  aggregateSpareParts,
  aggregateTrendData,
  getKpiSummary
}
