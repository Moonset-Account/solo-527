const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const config = require('../config/metrics_config')

const random = (min, max) => Math.random() * (max - min) + min
const randomInt = (min, max) => Math.floor(random(min, max + 1))
const pick = (arr) => arr[randomInt(0, arr.length - 1)]
const weightedPick = (arr, weights) => {
  const total = weights.reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (let i = 0; i < arr.length; i++) {
    r -= weights[i]
    if (r <= 0) return arr[i]
  }
  return arr[arr.length - 1]
}

const generateDateRange = (days = 90) => {
  const dates = []
  const end = dayjs()
  for (let i = days - 1; i >= 0; i--) {
    dates.push(end.subtract(i, 'day').format('YYYY-MM-DD'))
  }
  return dates
}

const generateWorkOrders = (dates) => {
  const orders = []
  let id = 1
  
  dates.forEach(date => {
    config.shifts.forEach(shift => {
      const orderCount = randomInt(2, 8)
      
      for (let i = 0; i < orderCount; i++) {
        const isPlanned = Math.random() < 0.35
        const equipment = pick(config.equipment)
        const category = pick(config.downtimeCategories)
        const team = pick(config.maintenanceTeams)
        const member = pick(team.members)
        
        const startHour = shift.id === 'morning' ? randomInt(6, 13) :
                         shift.id === 'afternoon' ? randomInt(14, 21) :
                         randomInt(22, 29) % 24
        
        const startTime = dayjs(`${date} ${String(startHour).padStart(2, '0')}:${String(randomInt(0, 55)).padStart(2, '0')}`)
        const duration = isPlanned ? randomInt(30, 240) : randomInt(15, 180)
        const endTime = startTime.add(duration, 'minute')
        
        const partsCount = randomInt(0, 4)
        const partsUsed = []
        let partsCost = 0
        
        for (let j = 0; j < partsCount; j++) {
          const part = pick(config.spareParts)
          const qty = randomInt(1, 3)
          partsUsed.push({ partId: part.id, partName: part.name, quantity: qty, unitCost: part.cost })
          partsCost += part.cost * qty
        }
        
        orders.push({
          id: `WO${String(id).padStart(6, '0')}`,
          date,
          shift: shift.id,
          shiftName: shift.name,
          equipmentId: equipment.id,
          equipmentName: equipment.name,
          lineId: equipment.line,
          lineName: config.productionLines.find(l => l.id === equipment.line).name,
          type: isPlanned ? config.downtimeTypes.PLANNED : config.downtimeTypes.UNPLANNED,
          typeName: isPlanned ? '计划检修' : '突发停机',
          plannedType: isPlanned ? pick(config.plannedMaintenanceTypes).id : null,
          category: category.id,
          categoryName: category.name,
          severity: randomInt(1, 4),
          description: `${category.name} - ${isPlanned ? '定期维护' : '故障报修'}`,
          startTime: startTime.format('YYYY-MM-DD HH:mm:ss'),
          endTime: endTime.format('YYYY-MM-DD HH:mm:ss'),
          durationMinutes: duration,
          responseTimeMinutes: isPlanned ? 0 : randomInt(5, 60),
          repairTimeMinutes: Math.max(5, duration - (isPlanned ? 0 : randomInt(5, 30))),
          teamId: team.id,
          teamName: team.name,
          technician: member,
          partsUsed,
          partsCost,
          laborCost: (duration / 60) * 150,
          totalCost: partsCost + (duration / 60) * 150,
          status: 'completed',
          notes: isPlanned 
            ? pick(['按计划执行定期维护', '更换易损件，检查设备状态', '润滑保养，清理积尘', '精度校准，参数优化'])
            : pick(['更换损坏轴承', '修复电气线路', '更换传感器', '调整液压系统压力', '紧固松动部件', '清理堵塞', '更换密封圈', '程序复位重启']),
          createdAt: startTime.format('YYYY-MM-DD HH:mm:ss')
        })
        id++
      }
    })
  })
  
  return orders
}

const generateAlarms = (workOrders) => {
  const alarms = []
  let id = 1
  
  workOrders.forEach(wo => {
    if (wo.type === config.downtimeTypes.UNPLANNED) {
      const alarmCount = randomInt(1, 3)
      for (let i = 0; i < alarmCount; i++) {
        const alarmTime = dayjs(wo.startTime).subtract(randomInt(0, 30), 'minute')
        alarms.push({
          id: `AL${String(id).padStart(6, '0')}`,
          workOrderId: wo.id,
          equipmentId: wo.equipmentId,
          equipmentName: wo.equipmentName,
          lineId: wo.lineId,
          alarmCode: `ERR${randomInt(100, 999)}`,
          alarmType: wo.categoryName,
          severity: wo.severity,
          message: `${wo.categoryName}报警 - ${wo.description}`,
          time: alarmTime.format('YYYY-MM-DD HH:mm:ss'),
          acknowledged: Math.random() < 0.9,
          acknowledgedBy: Math.random() < 0.9 ? pick(pick(config.maintenanceTeams).members) : null,
          acknowledgedAt: Math.random() < 0.9 ? alarmTime.add(randomInt(1, 10), 'minute').format('YYYY-MM-DD HH:mm:ss') : null
        })
        id++
      }
    }
  })
  
  return alarms
}

const generateProduction = (dates, workOrders) => {
  const production = []
  
  config.productionLines.forEach(line => {
    dates.forEach(date => {
      config.shifts.forEach(shift => {
        const lineOrders = workOrders.filter(wo => wo.lineId === line.id && wo.date === date && wo.shift === shift.id)
        const totalDowntime = lineOrders.reduce((sum, wo) => sum + wo.durationMinutes, 0)
        const availableTime = 8 * 60
        const runtime = Math.max(0, availableTime - totalDowntime)
        const baseOutput = randomInt(400, 600)
        const actualOutput = Math.floor(baseOutput * (runtime / availableTime) * random(0.85, 1.05))
        const defectRate = random(0.01, 0.05)
        const goodOutput = Math.floor(actualOutput * (1 - defectRate))
        
        production.push({
          id: `PROD-${line.id}-${date}-${shift.id}`,
          lineId: line.id,
          lineName: line.name,
          date,
          shift: shift.id,
          shiftName: shift.name,
          plannedOutput: baseOutput,
          actualOutput,
          goodOutput,
          defectOutput: actualOutput - goodOutput,
          defectRate: +defectRate.toFixed(4),
          runtimeMinutes: runtime,
          downtimeMinutes: totalDowntime,
          availability: +(runtime / availableTime).toFixed(4),
          performance: +(actualOutput / (baseOutput * (runtime / availableTime)) || 0).toFixed(4),
          quality: +(goodOutput / actualOutput || 0).toFixed(4),
          oee: +((runtime / availableTime) * (actualOutput / (baseOutput * (runtime / availableTime)) || 0) * (goodOutput / actualOutput || 0)).toFixed(4),
          workOrderCount: lineOrders.length,
          unplannedDowntimeMinutes: lineOrders.filter(wo => wo.type === config.downtimeTypes.UNPLANNED).reduce((sum, wo) => sum + wo.durationMinutes, 0)
        })
      })
    })
  })
  
  return production
}

const generateEquipmentStatus = (dates, workOrders) => {
  const status = []
  
  config.equipment.forEach(eq => {
    dates.forEach(date => {
      const eqOrders = workOrders.filter(wo => wo.equipmentId === eq.id && wo.date === date)
      const totalDowntime = eqOrders.reduce((sum, wo) => sum + wo.durationMinutes, 0)
      const unplannedDowntime = eqOrders.filter(wo => wo.type === config.downtimeTypes.UNPLANNED).reduce((sum, wo) => sum + wo.durationMinutes, 0)
      
      status.push({
        id: `EQ-${eq.id}-${date}`,
        equipmentId: eq.id,
        equipmentName: eq.name,
        lineId: eq.line,
        lineName: config.productionLines.find(l => l.id === eq.line).name,
        date,
        runtimeMinutes: Math.max(0, 24 * 60 - totalDowntime),
        downtimeMinutes: totalDowntime,
        unplannedDowntimeMinutes: unplannedDowntime,
        plannedDowntimeMinutes: totalDowntime - unplannedDowntime,
        availability: +((24 * 60 - totalDowntime) / (24 * 60)).toFixed(4),
        workOrderCount: eqOrders.length,
        mtbf: eqOrders.length > 0 ? Math.floor(((24 * 60 - totalDowntime) / eqOrders.length) / 60) : 24,
        mttr: eqOrders.length > 0 ? Math.floor(eqOrders.reduce((sum, wo) => sum + wo.repairTimeMinutes, 0) / eqOrders.length) : 0
      })
    })
  })
  
  return status
}

const main = () => {
  console.log('开始生成模拟数据...')
  
  const dates = generateDateRange(90)
  const workOrders = generateWorkOrders(dates)
  const alarms = generateAlarms(workOrders)
  const production = generateProduction(dates, workOrders)
  const equipmentStatus = generateEquipmentStatus(dates, workOrders)
  
  const dataDir = path.join(__dirname, '../raw')
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
  
  fs.writeFileSync(path.join(dataDir, 'work_orders.json'), JSON.stringify(workOrders, null, 2))
  fs.writeFileSync(path.join(dataDir, 'alarms.json'), JSON.stringify(alarms, null, 2))
  fs.writeFileSync(path.join(dataDir, 'production.json'), JSON.stringify(production, null, 2))
  fs.writeFileSync(path.join(dataDir, 'equipment_status.json'), JSON.stringify(equipmentStatus, null, 2))
  
  console.log(`生成完成:`)
  console.log(`  工单记录: ${workOrders.length} 条`)
  console.log(`  报警记录: ${alarms.length} 条`)
  console.log(`  产量记录: ${production.length} 条`)
  console.log(`  设备状态: ${equipmentStatus.length} 条`)
  console.log(`  数据天数: ${dates.length} 天`)
}

if (require.main === module) {
  main()
}

module.exports = { generateDateRange, generateWorkOrders, generateAlarms, generateProduction, generateEquipmentStatus }
